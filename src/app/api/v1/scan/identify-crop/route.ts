// POST /api/v1/scan/identify-crop
//
// Stage 0 (new): Identify ONLY the crop type from an image, no disease diagnosis.
// This exists specifically to split crop-identification from disease-diagnosis —
// previously a single Gemini call tried to guess BOTH simultaneously, which
// compounded errors (wrong crop guess -> wrong disease enum subset -> wrong
// diagnosis, with no way for the user to catch the crop error before the
// disease call ran). This endpoint lets the user confirm/correct the crop
// BEFORE any disease diagnosis happens.
//
// Expects: { image: string (base64 data URL or raw base64) }
// Returns: { success: true, data: { crop_type_slug, crop_name_en, crop_name_ur,
//            confidence_score, is_plant } } or an error response

import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenerativeAI, SchemaType } from '@google/generative-ai';
import { getAllCropSlugs, findMappingByDiseaseSlug } from '@/lib/hf/labelMap';

const CROP_SLUG_ENUM = getAllCropSlugs();

// Deliberately minimal schema — this call does ONE job. Keeping it narrow
// makes it faster and more accurate than the combined crop+disease call,
// the same way a single-purpose function is easier to get right than one
// that tries to do two things at once.
const CROP_ID_SCHEMA = {
  type: SchemaType.OBJECT,
  properties: {
    is_plant: {
      type: SchemaType.BOOLEAN,
      description: 'True if the image shows any plant, leaf, crop, or fruit at all.',
    },
    crop_type_slug: {
      type: SchemaType.STRING,
      enum: [...CROP_SLUG_ENUM, 'unknown_crop'],
      description:
        'The crop type shown in the image, matched to the closest entry in the allowed list. Use "unknown_crop" if is_plant is true but the crop is clearly not one of the supported types.',
    },
    confidence_score: {
      type: SchemaType.NUMBER,
      description: 'Confidence in this crop identification, from 0.0 to 1.0.',
    },
  },
  required: ['is_plant', 'crop_type_slug', 'confidence_score'],
};

const SYSTEM_PROMPT = `You are identifying which crop or plant is shown in a photo submitted by a Pakistani farmer.

Your ONLY job right now is to identify the crop type — do NOT attempt to diagnose any disease. Just determine:
1. Whether the image shows a plant/crop/leaf at all
2. Which crop it is, from the allowed list

Be conservative with confidence: if the image is blurry, too distant, poorly lit, or doesn't show clear identifying features (leaf shape, fruit, growth pattern), reflect that with a LOWER confidence_score rather than guessing confidently.

If the image does not show a plant at all, set is_plant to false.`;

interface CropIdResult {
  is_plant: boolean;
  crop_type_slug: string;
  confidence_score: number;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { image } = body as { image?: string };

    if (!image) {
      return NextResponse.json(
        {
          success: false,
          error: { code: 'MISSING_IMAGE', message: 'No image provided', message_ur: 'تصویر فراہم نہیں کی گئی' },
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

    let base64Data = image;
    let mimeType = 'image/jpeg';
    if (base64Data.startsWith('data:')) {
      const match = base64Data.match(/^data:(image\/\w+);base64,/);
      if (match && match[1]) mimeType = match[1];
      base64Data = base64Data.split(',')[1] || base64Data;
    }

    // IMPORTANT: this reads the same env var you already wired for the model
    // name in analyze/route.ts. Confirm the variable name below matches what
    // you actually named it in .env.local / Vercel — if it's different,
    // this is a one-line fix, not a new debugging session.
    const modelName = process.env.GEMINI_MODEL_NAME || 'gemini-2.5-flash';

    const genAI = new GoogleGenerativeAI(geminiKey);
    const model = genAI.getGenerativeModel({
      model: modelName,
      generationConfig: {
        responseMimeType: 'application/json',
        responseSchema: CROP_ID_SCHEMA as any,
        temperature: 0.1, // even lower than disease diagnosis — this is a narrower, more objective task
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
      console.error('Gemini fetch error (identify-crop):', fetchErr.name, fetchErr.message, fetchErr.cause ?? '');
      return NextResponse.json(
        { success: false, error: 'Fetch failed', message: 'Could not reach the AI model. Please try again.' },
        { status: 502 },
      );
    }
    clearTimeout(timeoutId);

    const responseText = geminiResult.response.text();

    let result: CropIdResult;
    try {
      result = JSON.parse(responseText);
    } catch {
      console.error('Gemini returned non-JSON despite schema constraint (identify-crop):', responseText);
      return NextResponse.json(
        {
          success: false,
          error: { code: 'PARSE_ERROR', message: 'Model returned malformed output', message_ur: 'ماڈل کا نتیجہ سمجھ نہیں آیا' },
        },
        { status: 502 },
      );
    }

    if (!result.is_plant) {
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

    if (result.crop_type_slug === 'unknown_crop') {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'UNKNOWN_CROP',
            message: 'This crop is not yet supported by FasalGuard.',
            message_ur: 'یہ فصل ابھی FasalGuard میں شامل نہیں ہے۔',
          },
        },
        { status: 422 },
      );
    }

    // Look up bilingual name for the identified crop. Any healthy-entry
    // mapping for this crop carries the crop_name_en/ur fields we need.
    const mapping = findMappingByDiseaseSlug('healthy', result.crop_type_slug);

    return NextResponse.json({
      success: true,
      data: {
        crop_type_slug: result.crop_type_slug,
        crop_name_en: mapping?.crop_name_en ?? result.crop_type_slug,
        crop_name_ur: mapping?.crop_name_ur ?? result.crop_type_slug,
        confidence_score: Math.round(result.confidence_score * 100) / 100,
      },
    });
  } catch (err: any) {
    console.error('Identify-crop error:', err);
    return NextResponse.json(
      { success: false, error: { code: 'UNKNOWN', message: err.message || 'Internal server error', message_ur: 'غیر متوقع خرابی' } },
      { status: 500 },
    );
  }
}