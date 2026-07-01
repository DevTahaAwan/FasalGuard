// POST /api/v1/scan/analyze
// Stage 1: Send captured image to Gemini Vision for crop disease classification
//
// REPLACES the HuggingFace-based implementation. Same request/response contract
// as before, so the frontend scanner page requires NO changes.
//
// Expects: { image: string (base64 data URL or raw base64), language: "en"|"ur" }
// Returns: ScanAnalyzeResponse (same shape as the HuggingFace version)

import { NextRequest, NextResponse } from 'next/server';
import { v4 as uuidv4 } from 'uuid';
import { GoogleGenerativeAI, SchemaType } from '@google/generative-ai';
import { getAllDiseaseSlugs, getAllCropSlugs, findMappingByDiseaseSlug, LabelMapping } from '@/lib/hf/labelMap';

// Build the constrained enum lists ONCE at module load, directly from labelMap.ts.
// If you add a disease to labelMap.ts, it automatically becomes a valid Gemini
// output value — no need to touch this file or hand-maintain a second list.
const DISEASE_SLUG_ENUM = getAllDiseaseSlugs();
const CROP_SLUG_ENUM = getAllCropSlugs();

// Gemini's structured output schema. This is the mechanism that prevents
// hallucination outside your taxonomy: Gemini is PHYSICALLY constrained to only
// return one of these enum values, the same way the old HF classifier could only
// return one of its 38 trained labels — except now the crop list actually matches
// what Pakistani farmers grow.
const RESPONSE_SCHEMA = {
  type: SchemaType.OBJECT,
  properties: {
    is_plant: {
      type: SchemaType.BOOLEAN,
      description:
        'True if the image shows a plant, leaf, crop, or fruit. False if the image is unrelated (e.g. a person, animal, object, blank photo, or unrecognizable blur).',
    },
    crop_type_slug: {
      type: SchemaType.STRING,
      enum: [...CROP_SLUG_ENUM, 'unknown_crop'],
      description:
        'The crop type shown in the image. Use "unknown_crop" ONLY if is_plant is true but the crop is clearly not one of the supported types.',
    },
    disease_slug: {
      type: SchemaType.STRING,
      enum: [...DISEASE_SLUG_ENUM, 'unrecognized_condition'],
      description:
        'The specific disease identified, matched to the closest entry in the allowed list based on visible symptoms. Use "healthy" if no disease is visible. Use "unrecognized_condition" ONLY if is_plant is true, the crop is recognized, but the visible symptoms do not clearly match any listed disease.',
    },
    confidence_score: {
      type: SchemaType.NUMBER,
      description:
        'Your confidence in this diagnosis, from 0.0 to 1.0, based on how clearly the symptoms match the identified disease.',
    },
    reasoning: {
      type: SchemaType.STRING,
      description:
        'One or two sentences describing the visible symptoms that led to this diagnosis (e.g. "Yellow-orange pustules in stripes along the leaf, consistent with stripe rust pattern").',
    },
  },
  required: ['is_plant', 'crop_type_slug', 'disease_slug', 'confidence_score', 'reasoning'],
};

// Keep the prompt SHORT. Do not restate the schema in the prompt text —
// Gemini's docs explicitly warn this lowers output quality. The schema enum
// already constrains crop/disease selection; the prompt only needs to set
// the task framing and refusal behavior.
const SYSTEM_PROMPT = `You are an agricultural plant pathologist analyzing a photo submitted by a Pakistani farmer through a crop disease detection app.

Look at the image and determine:
1. Whether it shows a plant/crop/leaf at all
2. Which crop it is, from the allowed list
3. Whether the crop shows signs of disease, and if so, which specific disease from the allowed list most closely matches the visible symptoms
4. How confident you are

Be conservative: if the image is blurry, poorly lit, too zoomed out, or doesn't clearly show diagnostic symptoms, reflect that with a LOWER confidence_score rather than guessing confidently. Do not force-fit ambiguous symptoms into a disease label if "healthy" or "unrecognized_condition" is a more honest answer.

If the image does not show a plant at all (a person, an object, a blank photo, etc.), set is_plant to false and leave the other fields as your best-effort placeholder.`;

interface GeminiDiagnosis {
  is_plant: boolean;
  crop_type_slug: string;
  disease_slug: string;
  confidence_score: number;
  reasoning: string;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { image } = body as { image?: string };

    if (!image) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'MISSING_IMAGE',
            message: 'No image provided',
            message_ur: 'تصویر فراہم نہیں کی گئی',
          },
        },
        { status: 400 },
      );
    }

    const geminiKey = process.env.GEMINI_API_KEY;
    if (!geminiKey) {
      console.error('GEMINI_API_KEY is not set');
      return NextResponse.json(
        { error: 'API Key Missing', message: 'GEMINI_API_KEY is not configured on the server.' },
        { status: 500 },
      );
    }

    // Extract raw base64 + mime type from data URL (strip "data:image/...;base64," prefix)
    let base64Data = image;
    let mimeType = 'image/jpeg';
    if (base64Data.startsWith('data:')) {
      const match = base64Data.match(/^data:(image\/\w+);base64,/);
      if (match && match[1]) mimeType = match[1];
      base64Data = base64Data.split(',')[1] || base64Data;
    }

    const genAI = new GoogleGenerativeAI(geminiKey);
    const model = genAI.getGenerativeModel({
      model: 'gemini-2.0-flash',
      generationConfig: {
        responseMimeType: 'application/json',
        responseSchema: RESPONSE_SCHEMA as any,
        temperature: 0.2, // low temperature: we want consistent classification, not creativity
      },
    });

    // 8-second timeout via AbortController — do not let a single scan hang
    // the way the old HuggingFace retries did (18+ seconds observed in testing).
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 8000);

    let geminiResult;
    try {
      geminiResult = await model.generateContent(
        [
          SYSTEM_PROMPT,
          {
            inlineData: {
              data: base64Data,
              mimeType,
            },
          },
        ],
        { signal: controller.signal } as any,
      );
    } catch (fetchErr: any) {
      clearTimeout(timeoutId);
      console.error('Gemini fetch error:', fetchErr.name, fetchErr.message, fetchErr.cause ?? '');
      return NextResponse.json(
        {
          success: false,
          error: 'Fetch failed',
          message: 'Could not reach the AI model. Please try again.',
        },
        { status: 502 },
      );
    }
    clearTimeout(timeoutId);

    const responseText = geminiResult.response.text();

    let diagnosis: GeminiDiagnosis;
    try {
      diagnosis = JSON.parse(responseText);
    } catch (parseErr) {
      console.error('Gemini returned non-JSON despite schema constraint:', responseText);
      return NextResponse.json(
        {
          success: false,
          error: { code: 'PARSE_ERROR', message: 'Model returned malformed output', message_ur: 'ماڈل کا نتیجہ سمجھ نہیں آیا' },
        },
        { status: 502 },
      );
    }

    // Reject non-plant images explicitly instead of forcing a fake diagnosis —
    // this is the exact failure mode the old closed-set HF classifier could never handle.
    if (!diagnosis.is_plant) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'NOT_A_PLANT',
            message: 'The image does not appear to show a plant or crop. Please retake the photo.',
            message_ur: 'تصویر میں فصل یا پودا نظر نہیں آ رہا۔ براہ کرم دوبارہ تصویر لیں۔',
          },
        },
        { status: 422 },
      );
    }

    // Look up the full bilingual mapping using the disease_slug Gemini returned.
    // Because disease_slug was schema-constrained to your enum, this lookup
    // should always succeed — but we guard anyway in case Gemini returns
    // "healthy" or "unrecognized_condition" which need special handling.
    let mapping: LabelMapping | null = null;
    if (diagnosis.disease_slug === 'healthy') {
      mapping = findMappingByDiseaseSlug('healthy', diagnosis.crop_type_slug);
    } else if (diagnosis.disease_slug !== 'unrecognized_condition') {
      mapping = findMappingByDiseaseSlug(diagnosis.disease_slug);
    }

    if (!mapping) {
      // Either "unrecognized_condition" or a crop/slug combo we couldn't resolve.
      // Return a low-confidence, honest result instead of failing outright.
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'LOW_CONFIDENCE',
            message: `Crop or condition recognized, but not confidently matched. ${diagnosis.reasoning}`,
            message_ur: 'فصل یا بیماری کی درست شناخت نہیں ہو سکی۔ براہ کرم واضح تصویر لیں۔',
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
      ai_reasoning: diagnosis.reasoning, // new field — the old HF model could never explain itself
    };

    return NextResponse.json({ success: true, data: result });
  } catch (err: any) {
    console.error('Scan analyze error:', err);
    return NextResponse.json(
      {
        success: false,
        error: { code: 'UNKNOWN', message: err.message || 'Internal server error', message_ur: 'غیر متوقع خرابی' },
      },
      { status: 500 },
    );
  }
}