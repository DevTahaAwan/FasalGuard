// Mock advisory data — realistic bilingual treatment advisories
// Structure matches AdvisoryResponse from src/types/api.ts

import type { AdvisoryResponse } from '@/types/api';

// ─── Wheat Yellow Rust Advisory ───────────────────────────────────────────────

export const MOCK_WHEAT_YELLOW_RUST_ADVISORY: AdvisoryResponse = {
  scan_id: 'scan-001-wheat-yellow-rust',
  disease_summary:
    'Yellow Rust (Puccinia striiformis) has been detected on your wheat crop. This is a serious fungal disease that spreads rapidly in cool, humid conditions.',
  severity_explanation:
    'The infection is at a moderate stage. Stripe patterns of yellow pustules are visible on leaves. Immediate treatment within 3 days is recommended to prevent spread to other plants.',
  urgency_level: 'within_3_days',
  advisory_type: 'disease_treatment',
  products: [
    {
      type: 'fungicide',
      name: 'Tilt 250 EC',
      dosage: '1 ml per litre of water (500ml per acre)',
      application_timing: 'Spray in the morning or evening. Repeat after 14 days if infection persists.',
      is_primary: true,
      brand_name_ssml: '<phoneme alphabet="ipa" ph="tɪlt">Tilt</phoneme> 250 EC',
    },
    {
      type: 'fungicide',
      name: 'Bumper 25 EC',
      dosage: '1.5 ml per litre of water (750ml per acre)',
      application_timing: 'Alternative to Tilt. Apply in the morning. Do not apply in rain.',
      is_primary: false,
      brand_name_ssml: null,
    },
  ],
  safety_note:
    'Wear gloves, face mask and protective clothing during spraying. Do not spray near water bodies. Keep children and animals away from sprayed area for 24 hours.',
  full_advisory_text:
    'آپ کی گندم میں پیلا زنگ کی بیماری پائی گئی ہے۔ یہ ایک سنگین پھپھوند کی بیماری ہے جو تیزی سے پھیل سکتی ہے۔ فوری علاج کریں۔ ٹِلٹ ڈھائی سو ای سی ایک ملی لیٹر فی لیٹر پانی میں ملا کر صبح یا شام سپرے کریں۔ سپرے کرتے وقت دستانے اور ماسک پہنیں۔',
};

// ─── Tomato Early Blight Advisory ─────────────────────────────────────────────

export const MOCK_TOMATO_EARLY_BLIGHT_ADVISORY: AdvisoryResponse = {
  scan_id: 'scan-002-tomato-blight',
  disease_summary:
    'Early Blight (Alternaria solani) detected on your tomato plants. Brown spots with concentric rings are visible on lower leaves.',
  severity_explanation:
    'Infection is at early stage. Affected leaves should be removed and treated immediately.',
  urgency_level: 'within_week',
  advisory_type: 'disease_treatment',
  products: [
    {
      type: 'fungicide',
      name: 'Dithane M-45',
      dosage: '2.5 grams per litre of water (1.25 kg per acre)',
      application_timing: 'Spray every 7 days for 3 applications. Start at first sign of disease.',
      is_primary: true,
      brand_name_ssml: null,
    },
  ],
  safety_note:
    'Keep away from eyes and skin. Do not consume sprayed tomatoes for 7 days after last application. Wash hands thoroughly after handling.',
  full_advisory_text:
    'آپ کے ٹماٹر میں ابتدائی جھلسن کی بیماری ملی ہے۔ متاثرہ پتے ہٹائیں اور ڈائیتھین ایم پینتالیس کا سپرے کریں۔ ہر سات دن میں تین بار سپرے کریں۔',
};

// ─── Healthy Crop Advisory ─────────────────────────────────────────────────────

export const MOCK_HEALTHY_ADVISORY: AdvisoryResponse = {
  scan_id: 'scan-003-healthy',
  disease_summary: 'Your crop appears healthy. No active disease detected.',
  severity_explanation:
    'The scan shows no signs of disease. Continue regular monitoring and preventive care.',
  urgency_level: 'preventive',
  advisory_type: 'healthy_confirmation',
  products: [],
  safety_note: null,
  full_advisory_text:
    'آپ کی فصل صحت مند ہے۔ کوئی بیماری نہیں ملی۔ باقاعدہ نگرانی جاری رکھیں اور اچھے زرعی طریقوں پر عمل کریں۔',
};

// ─── Advisory Map ─────────────────────────────────────────────────────────────

export const MOCK_ADVISORIES: Record<string, AdvisoryResponse> = {
  'wheat_yellow_rust': MOCK_WHEAT_YELLOW_RUST_ADVISORY,
  'tomato_early_blight': MOCK_TOMATO_EARLY_BLIGHT_ADVISORY,
  'healthy': MOCK_HEALTHY_ADVISORY,
};

/** Get a mock advisory by disease slug (returns healthy if not found) */
export function getMockAdvisory(diseaseSlug: string): AdvisoryResponse {
  return MOCK_ADVISORIES[diseaseSlug] ?? MOCK_HEALTHY_ADVISORY;
}
