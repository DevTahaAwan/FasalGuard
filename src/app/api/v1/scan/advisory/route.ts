// POST /api/v1/scan/advisory
// Stage 2: Generate bilingual treatment advisory using Google Gemini
//
// Expects: { scan_id, disease_label, disease_slug, crop_type, disease_name_en,
//            disease_name_ur, language, severity }
// Returns: AdvisoryResponse

import { NextRequest, NextResponse } from 'next/server';




interface AdvisoryRequestBody {
  scan_id: string;
  disease_label: string;
  disease_slug: string;
  crop_type: string;
  disease_name_en?: string;
  disease_name_ur?: string;
  language: 'en' | 'ur';
  severity: string;
  is_healthy?: boolean;
}

function buildPrompt(body: AdvisoryRequestBody): string {
  if (body.is_healthy || body.disease_slug === 'healthy') {
    return `You are an agricultural expert AI assistant for Pakistani farmers. The scan detected a HEALTHY ${body.crop_type} plant.

Generate a JSON response confirming the plant is healthy with preventive care tips. The response must be in both English and Urdu.

Return ONLY valid JSON (no markdown fences) matching this exact structure:
{
  "disease_summary": "Brief 1-2 sentence confirmation that the crop is healthy (in English)",
  "severity_explanation": "Brief 1-2 sentence preventive care tip in Urdu (using Urdu script نستعلیق)",
  "urgency_level": "preventive",
  "advisory_type": "healthy_confirmation",
  "products": [],
  "safety_note": null,
  "full_advisory_text": "Complete paragraph in Urdu for text-to-speech, covering that the crop is healthy and basic preventive care"
}`;
  }

  return `You are an agricultural expert AI assistant for Pakistani farmers. You provide bilingual (English + Urdu) treatment advisories for crop diseases.

A scan has detected the following:
- Crop: ${body.crop_type} (${body.disease_name_ur || body.crop_type})
- Disease: ${body.disease_name_en || body.disease_label} (${body.disease_name_ur || body.disease_label})
- Severity: ${body.severity}

Generate a treatment advisory as JSON. The advisory must:
1. Be accurate for this specific crop disease
2. Recommend real products available in Pakistan (fungicides, pesticides, fertilizers)
3. Include proper dosages
4. Include safety notes in both languages

Return ONLY valid JSON (no markdown fences) matching this exact structure:
{
  "disease_summary": "2-3 sentence description of the disease and what was detected (in English)",
  "severity_explanation": "1-2 sentence explanation of the severity and urgency in Urdu (using Urdu script نستعلیق)",
  "urgency_level": "within_3_days" or "within_week" or "today" or "preventive",
  "advisory_type": "disease_treatment",
  "products": [
    {
      "type": "fungicide" or "bactericide" or "insecticide" or "herbicide" or "fertilizer" or "bio_control",
      "name": "Product brand name available in Pakistan",
      "dosage": "Exact dosage instructions",
      "application_timing": "When and how often to apply",
      "is_primary": true or false,
      "brand_name_ssml": null
    }
  ],
  "safety_note": "Safety precautions in English (1-2 sentences)",
  "full_advisory_text": "Complete paragraph in Urdu (نستعلیق script) for text-to-speech. Cover: what disease was found, treatment steps, dosage, safety precautions. This should be 4-6 sentences, conversational, and easy to understand for rural Pakistani farmers."
}

Include 1-3 products. The first should be the primary treatment. Be specific about Pakistani brand names where possible (e.g., Tilt 250 EC, Dithane M-45, Score 250 EC, Antracol, Nativo, etc.).`;
}

export async function POST(request: NextRequest) {
  try {
    const body: AdvisoryRequestBody = await request.json();

    if (!body.scan_id || !body.disease_slug) {
      return NextResponse.json(
        { success: false, error: { code: 'MISSING_FIELDS', message: 'scan_id and disease_slug are required', message_ur: 'ضروری فیلڈز موجود نہیں' } },
        { status: 400 },
      );
    }

    const geminiKey = process.env.GEMINI_API_KEY;
    const geminiModel = process.env.GEMINI_MODEL;

    if (!geminiKey || !geminiModel) {
      console.error('GEMINI_API_KEY or GEMINI_MODEL is not set');
      return NextResponse.json(
        { success: false, error: { code: 'CONFIG_ERROR', message: 'Gemini configuration (API key or model) missing', message_ur: 'سرور کی ترتیب میں خرابی' } },
        { status: 500 },
      );
    }

    const GEMINI_API_BASE = `https://generativelanguage.googleapis.com/v1beta/models/${geminiModel}:generateContent`;

    const prompt = buildPrompt(body);

    const geminiResponse = await fetch(`${GEMINI_API_BASE}?key=${geminiKey}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: {
          temperature: 0.3,
          maxOutputTokens: 1024,
          responseMimeType: 'application/json',
        },
      }),
    });

    if (!geminiResponse.ok) {
      const errText = await geminiResponse.text();
      console.error('Gemini API error:', geminiResponse.status, errText);
      return NextResponse.json(
        { success: false, error: { code: 'GEMINI_ERROR', message: 'Failed to generate advisory', message_ur: 'مشاورت بنانے میں ناکامی' } },
        { status: 502 },
      );
    }

    const geminiData = await geminiResponse.json();

    // Extract text from Gemini response
    const rawText =
      geminiData?.candidates?.[0]?.content?.parts?.[0]?.text || '';

    // Parse JSON from the response (handle potential markdown fences)
    let advisoryJson;
    try {
      const cleaned = rawText
        .replace(/```json\s*/gi, '')
        .replace(/```\s*/g, '')
        .trim();
      advisoryJson = JSON.parse(cleaned);
    } catch (parseErr) {
      console.error('Failed to parse Gemini JSON:', rawText);
      return NextResponse.json(
        { success: false, error: { code: 'PARSE_ERROR', message: 'Failed to parse advisory response', message_ur: 'جواب پڑھنے میں خرابی' } },
        { status: 502 },
      );
    }

    // Attach the scan_id
    advisoryJson.scan_id = body.scan_id;

    return NextResponse.json({ success: true, data: advisoryJson });
  } catch (err: any) {
    console.error('Advisory error:', err);
    return NextResponse.json(
      { success: false, error: { code: 'UNKNOWN', message: err.message || 'Internal server error', message_ur: 'غیر متوقع خرابی' } },
      { status: 500 },
    );
  }
}
