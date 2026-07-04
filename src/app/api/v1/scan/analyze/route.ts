// POST /api/v1/scan/analyze
// Stage 1: Given a KNOWN crop (user-selected or confirmed via /identify-crop),
// diagnose disease from the image.
//
// BREAKING CHANGE (July 2026): this endpoint now REQUIRES crop_type_slug in
// the request body. Previously it guessed crop and disease simultaneously in
// one call, which compounded errors — a wrong crop guess silently produced a
// wrong disease diagnosis with no way to catch it. Now the crop must already
// be known before this endpoint runs, either because the user selected it
// directly, or because /api/v1/scan/identify-crop identified and the user
// confirmed it. The disease enum below is scoped to ONLY that crop's diseases,
// not all 60+ across every crop — this is a categorically easier and more
// accurate task for Gemini than guessing crop+disease at once.
//
// Expects: { image: string (base64 data URL or raw base64), crop_type_slug: string, language: "en"|"ur" }
// Returns: ScanAnalyzeResponse

import { NextRequest, NextResponse } from 'next/server';
import { v4 as uuidv4 } from 'uuid';
import { GoogleGenerativeAI, SchemaType } from '@google/generative-ai';
import { getDiseaseSlugsForCrop, getAllCropSlugs, findMappingByDiseaseSlug, LabelMapping } from '@/lib/hf/labelMap';

const CROP_SLUG_ENUM = getAllCropSlugs();

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { image, crop_type_slug: cropTypeSlug } = body as { image?: string; crop_type_slug?: string };

    if (!image) {
      return NextResponse.json(
        {
          success: false,
          error: { code: 'MISSING_IMAGE', message: 'No image provided', message_ur: 'تصویر فراہم نہیں کی گئی' },
        },
        { status: 400 },
      );
    }

    if (!cropTypeSlug || !CROP_SLUG_ENUM.includes(cropTypeSlug)) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'MISSING_CROP',
            message:
              'A known crop type is required before disease diagnosis. Select a crop first, or use /api/v1/scan/identify-crop.',
            message_ur: 'بیماری کی تشخیص سے پہلے فصل کی قسم درکار ہے۔',
          },
        },
        { status: 400 },
      );
    }

    // Build the disease enum SCOPED TO THIS CROP ONLY, at request time —
    // this is the core fix. Gemini is no longer choosing among 60+ diseases
    // across every crop; it's choosing among the ~5-8 diseases that actually
    // apply to the crop the user already told us this is.
    const diseaseSlugEnum = getDiseaseSlugsForCrop(cropTypeSlug);

    const RESPONSE_SCHEMA = {
      type: SchemaType.OBJECT,
      properties: {
        disease_slug: {
          type: SchemaType.STRING,
          enum: [...diseaseSlugEnum, 'unrecognized_condition'],
          description:
            'The specific disease identified, matched to the closest entry in the allowed list based on visible symptoms. Use "healthy" if no disease is visible. Use "unrecognized_condition" ONLY if the visible symptoms do not clearly match any listed disease for this crop.',
        },
        confidence_score: {
          type: SchemaType.NUMBER,
          description: 'Your confidence in this diagnosis, from 0.0 to 1.0, based on how clearly the symptoms match the identified disease.',
        },
        reasoning: {
          type: SchemaType.STRING,
          description:
            'One or two sentences describing the visible symptoms that led to this diagnosis (e.g. "Yellow-orange pustules in stripes along the leaf, consistent with stripe rust pattern").',
        },
      },
      required: ['disease_slug', 'confidence_score', 'reasoning'],
    };

    const SYSTEM_PROMPT = `You are an agricultural plant pathologist analyzing a photo of a ${cropTypeSlug} plant, submitted by a Pakistani farmer through a crop disease detection app.

The crop has ALREADY been identified as ${cropTypeSlug} — do not second-guess or override this. Your only job is to determine whether this ${cropTypeSlug} plant shows signs of disease, and if so, which specific disease from the allowed list (all specific to ${cropTypeSlug}) most closely matches the visible symptoms.

Be conservative: if the image is blurry, poorly lit, too zoomed out, or doesn't clearly show diagnostic symptoms, reflect that with a LOWER confidence_score rather than guessing confidently.

CRITICAL — asymmetric risk: a missed disease costs a farmer a real crop and a real treatment window. A false "please retake the photo" costs thirty seconds. These are NOT equally bad mistakes. Therefore:
- Only return "healthy" when the visible leaf/fruit tissue is clean, uniform, and shows no discoloration, spotting, lesions, curling, wilting, or texture irregularities of any kind.
- If ANY of the following are visible, even faintly — yellowing or mottling, spotting or lesions, discoloration, unusual texture on fruit or leaf surface, curling, or wilting — do NOT return "healthy". Return your best-matching disease_slug instead, even at lower confidence. A tentative disease flag the farmer can verify with a dealer is far more useful than a false all-clear.
- If the image quality itself is the limiting factor (blur, distance, poor lighting, obstruction) rather than the plant's condition, use "unrecognized_condition" with a note in your reasoning that a clearer photo is needed — do not default to "healthy" just because you cannot confidently name a specific disease.
- When symptoms are visible but ambiguous between two similar diseases, pick the more common one for ${cropTypeSlug} in Pakistan and note the alternative in your reasoning, rather than defaulting to "healthy" to avoid choosing.`;

    const geminiKey = process.env.GEMINI_API_KEY;
    if (!geminiKey) {
      console.error('GEMINI_API_KEY is not set');
      return NextResponse.json(
        { error: 'API Key Missing', message: 'GEMINI_API_KEY is not configured on the server.' },
        { status: 500 },
      );
    }

    let base64Data = image;
    let mimeType = 'image/jpeg';
    if (base64Data.startsWith('data:')) {
      const match = base64Data.match(/^data:(image\/\w+);base64,/);
      if (match && match[1]) mimeType = match[1];
      base64Data = base64Data.split(',')[1] || base64Data;
    }

    // IMPORTANT: confirm this env var name matches what you actually set —
    // you mentioned moving the model name into .env.local yourself. If your
    // variable is named differently, this is a one-line rename, not a new bug.
    const modelName = process.env.GEMINI_MODEL_NAME || 'gemini-2.5-flash';

    const genAI = new GoogleGenerativeAI(geminiKey);
    const model = genAI.getGenerativeModel({
      model: modelName,
      generationConfig: {
        responseMimeType: 'application/json',
        responseSchema: RESPONSE_SCHEMA as any,
        temperature: 0.2,
      },
    });

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 20000);

    let geminiResult;
    try {
      geminiResult = await model.generateContent(
        [SYSTEM_PROMPT, { inlineData: { data: base64Data, mimeType } }],
        { signal: controller.signal } as any,
      );
    } catch (fetchErr: any) {
      clearTimeout(timeoutId);
      console.error('Gemini fetch error:', fetchErr.name, fetchErr.message, fetchErr.cause ?? '');
      return NextResponse.json(
        { success: false, error: 'Fetch failed', message: 'Could not reach the AI model. Please try again.' },
        { status: 502 },
      );
    }
    clearTimeout(timeoutId);

    const responseText = geminiResult.response.text();

    let diagnosis: { disease_slug: string; confidence_score: number; reasoning: string };
    try {
      diagnosis = JSON.parse(responseText);
    } catch {
      console.error('Gemini returned non-JSON despite schema constraint:', responseText);
      return NextResponse.json(
        {
          success: false,
          error: { code: 'PARSE_ERROR', message: 'Model returned malformed output', message_ur: 'ماڈل کا نتیجہ سمجھ نہیں آیا' },
        },
        { status: 502 },
      );
    }

    let mapping: LabelMapping | null = null;
    if (diagnosis.disease_slug === 'healthy') {
      mapping = findMappingByDiseaseSlug('healthy', cropTypeSlug);
    } else if (diagnosis.disease_slug !== 'unrecognized_condition') {
      mapping = findMappingByDiseaseSlug(diagnosis.disease_slug, cropTypeSlug);
    }

    if (!mapping) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'LOW_CONFIDENCE',
            message: `Condition not confidently matched. ${diagnosis.reasoning}`,
            message_ur: 'بیماری کی درست شناخت نہیں ہو سکی۔ براہ کرم واضح تصویر لیں۔',
          },
        },
        { status: 422 },
      );
    }

    const confidenceScore = Math.round(diagnosis.confidence_score * 100) / 100;

    let confidenceLevel: 'high' | 'medium' | 'low';
    if (confidenceScore >= 0.7) confidenceLevel = 'high';
    else if (confidenceScore >= 0.4) confidenceLevel = 'medium';
    else confidenceLevel = 'low';

    const status = confidenceScore < 0.4 ? ('low_confidence' as const) : ('completed' as const);
    const scanId = `scan-${uuidv4().slice(0, 8)}`;

    const result = {
      scan_id: scanId,
      disease_label: diagnosis.disease_slug,
      disease_slug: mapping.disease_slug,
      confidence_score: confidenceScore,
      severity: mapping.default_severity,
      is_healthy: mapping.is_healthy,
      risk_advisory_triggered: !mapping.is_healthy && confidenceScore >= 0.7,
      status,
      confidence_level: confidenceLevel,
      crop_type_slug: mapping.crop_type_slug,
      crop_name_en: mapping.crop_name_en,
      crop_name_ur: mapping.crop_name_ur,
      disease_name_en: mapping.disease_name_en,
      disease_name_ur: mapping.disease_name_ur,
      scanned_at: new Date().toISOString(),
      ai_reasoning: diagnosis.reasoning,
    };

    return NextResponse.json({ success: true, data: result });
  } catch (err: any) {
    console.error('Scan analyze error:', err);
    return NextResponse.json(
      { success: false, error: { code: 'UNKNOWN', message: err.message || 'Internal server error', message_ur: 'غیر متوقع خرابی' } },
      { status: 500 },
    );
  }
}