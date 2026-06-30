// POST /api/v1/scan/analyze
// Stage 1: Send captured image to HuggingFace for plant disease classification
//
// Expects: { image: string (base64 data URL or raw base64), language: "en"|"ur" }
// Returns: ScanAnalyzeResponse

import { NextRequest, NextResponse } from 'next/server';
import { v4 as uuidv4 } from 'uuid';
import { resolveLabel, buildFallbackMapping } from '@/lib/hf/labelMap';

const HF_API_URL =
  'https://api-inference.huggingface.co/models/linkanjarad/mobilenet_v2_1.0_224-plant-disease-identification';

interface HFPrediction {
  label: string;
  score: number;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { image } = body as { image?: string };

    if (!image) {
      return NextResponse.json(
        { success: false, error: { code: 'MISSING_IMAGE', message: 'No image provided', message_ur: 'تصویر فراہم نہیں کی گئی' } },
        { status: 400 },
      );
    }

    const hfToken = process.env.HUGGINGFACE_API_TOKEN;
    if (!hfToken) {
      console.error('HUGGINGFACE_API_TOKEN is not set');
      return NextResponse.json(
        { error: 'API Key Missing', message: 'Please restart the Next.js dev server to load .env.local' },
        { status: 500 },
      );
    }

    // Extract raw base64 bytes from data URL (strip "data:image/...;base64," prefix if present)
    let base64Data = image;
    if (base64Data.startsWith('data:')) {
      base64Data = base64Data.split(',')[1] || base64Data;
    }

    // Convert base64 to binary buffer for the HF API
    const imageBuffer = Buffer.from(base64Data, 'base64');

    // Call HuggingFace Inference API — single attempt, no retries on server
    // (Vercel serverless has a 10s timeout; retries must happen on the client)
    let hfResponse: Response;
    try {
      hfResponse = await fetch(HF_API_URL, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${hfToken}`,
          'Content-Type': 'application/octet-stream',
        },
        body: imageBuffer,
      });
    } catch (fetchErr: any) {
      console.error('HuggingFace fetch error:', fetchErr.message);
      return NextResponse.json(
        { success: false, error: 'Fetch failed', message: 'Could not reach the AI model. Please try again.' },
        { status: 502 },
      );
    }

    // If model is loading (503), pass estimated_time back to the client
    if (hfResponse.status === 503) {
      let estimatedTime = 20;
      try {
        const loadingBody = await hfResponse.json();
        if (loadingBody.estimated_time) {
          estimatedTime = Math.ceil(loadingBody.estimated_time);
        }
      } catch {
        // ignore parse errors
      }
      console.log(`HuggingFace model loading, estimated_time=${estimatedTime}s`);
      return NextResponse.json(
        { success: false, error: 'Model loading', message: 'The AI model is waking up.', estimated_time: estimatedTime },
        { status: 503 },
      );
    }

    if (!hfResponse.ok) {
      const errText = await hfResponse.text();
      console.error('HuggingFace API error:', hfResponse.status, errText);
      return NextResponse.json(
        { success: false, error: 'API error', message: 'Failed to classify image. Please try again.' },
        { status: 502 },
      );
    }

    const predictions: HFPrediction[] = await hfResponse.json();

    if (!predictions || predictions.length === 0) {
      return NextResponse.json(
        { success: false, error: { code: 'NO_PREDICTIONS', message: 'Model returned no predictions', message_ur: 'ماڈل نے کوئی نتیجہ نہیں دیا' } },
        { status: 422 },
      );
    }

    // Take the top prediction
    const top = predictions[0];
    if (!top) {
      return NextResponse.json(
        { success: false, error: { code: 'NO_PREDICTIONS', message: 'Model returned empty prediction', message_ur: 'ماڈل نے کوئی نتیجہ نہیں دیا' } },
        { status: 422 },
      );
    }
    const confidenceScore = Math.round(top.score * 100) / 100;

    // Map HF label to our internal structure
    const mapping = resolveLabel(top.label) ?? buildFallbackMapping(top.label);

    // Determine confidence level
    let confidenceLevel: 'high' | 'medium' | 'low';
    if (confidenceScore >= 0.7) confidenceLevel = 'high';
    else if (confidenceScore >= 0.4) confidenceLevel = 'medium';
    else confidenceLevel = 'low';

    // Determine status
    const status = confidenceScore < 0.4 ? 'low_confidence' as const : 'completed' as const;

    const scanId = `scan-${uuidv4().slice(0, 8)}`;

    const result = {
      scan_id: scanId,
      disease_label: top.label,
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
      // Include top-3 predictions for debugging / UI display
      top_predictions: predictions.slice(0, 3).map((p) => ({
        label: p.label,
        score: Math.round(p.score * 100) / 100,
      })),
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
