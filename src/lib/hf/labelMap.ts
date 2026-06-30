// HuggingFace Label → FasalGuard Disease Mapping
// Model: linkanjarad/mobilenet_v2_1.0_224-plant-disease-identification
//
// This model outputs labels like "Tomato___Early_blight" or "Potato___healthy".
// We map each to our internal crop/disease structure with bilingual names.

export interface LabelMapping {
  crop_type_slug: string;
  crop_name_en: string;
  crop_name_ur: string;
  disease_slug: string;
  disease_name_en: string;
  disease_name_ur: string;
  default_severity: 'healthy' | 'low' | 'moderate' | 'high' | 'urgent';
  is_healthy: boolean;
}

/**
 * Map from HuggingFace model label → structured FasalGuard data.
 *
 * Label format from the model: "Crop___Disease_name" or "Crop___healthy"
 * We normalize by lowercasing and replacing spaces/special chars.
 */
const LABEL_MAP: Record<string, LabelMapping> = {
  // ─── Tomato ────────────────────────────────────────────────────────────
  'Tomato___Early_blight': {
    crop_type_slug: 'tomato',
    crop_name_en: 'Tomato',
    crop_name_ur: 'ٹماٹر',
    disease_slug: 'tomato_early_blight',
    disease_name_en: 'Early Blight',
    disease_name_ur: 'ابتدائی جھلساؤ',
    default_severity: 'moderate',
    is_healthy: false,
  },
  'Tomato___Late_blight': {
    crop_type_slug: 'tomato',
    crop_name_en: 'Tomato',
    crop_name_ur: 'ٹماٹر',
    disease_slug: 'tomato_late_blight',
    disease_name_en: 'Late Blight',
    disease_name_ur: 'آخری جھلساؤ',
    default_severity: 'high',
    is_healthy: false,
  },
  'Tomato___Bacterial_spot': {
    crop_type_slug: 'tomato',
    crop_name_en: 'Tomato',
    crop_name_ur: 'ٹماٹر',
    disease_slug: 'tomato_bacterial_spot',
    disease_name_en: 'Bacterial Spot',
    disease_name_ur: 'بیکٹیریل داغ',
    default_severity: 'moderate',
    is_healthy: false,
  },
  'Tomato___Leaf_Mold': {
    crop_type_slug: 'tomato',
    crop_name_en: 'Tomato',
    crop_name_ur: 'ٹماٹر',
    disease_slug: 'tomato_leaf_mold',
    disease_name_en: 'Leaf Mold',
    disease_name_ur: 'پتوں کی پھپھوندی',
    default_severity: 'moderate',
    is_healthy: false,
  },
  'Tomato___Septoria_leaf_spot': {
    crop_type_slug: 'tomato',
    crop_name_en: 'Tomato',
    crop_name_ur: 'ٹماٹر',
    disease_slug: 'tomato_septoria_leaf_spot',
    disease_name_en: 'Septoria Leaf Spot',
    disease_name_ur: 'سیپٹوریا پتوں کے داغ',
    default_severity: 'moderate',
    is_healthy: false,
  },
  'Tomato___Spider_mites Two-spotted_spider_mite': {
    crop_type_slug: 'tomato',
    crop_name_en: 'Tomato',
    crop_name_ur: 'ٹماٹر',
    disease_slug: 'tomato_spider_mites',
    disease_name_en: 'Spider Mites',
    disease_name_ur: 'مکڑی کے کیڑے',
    default_severity: 'moderate',
    is_healthy: false,
  },
  'Tomato___Target_Spot': {
    crop_type_slug: 'tomato',
    crop_name_en: 'Tomato',
    crop_name_ur: 'ٹماٹر',
    disease_slug: 'tomato_target_spot',
    disease_name_en: 'Target Spot',
    disease_name_ur: 'ہدف داغ',
    default_severity: 'moderate',
    is_healthy: false,
  },
  'Tomato___Tomato_Yellow_Leaf_Curl_Virus': {
    crop_type_slug: 'tomato',
    crop_name_en: 'Tomato',
    crop_name_ur: 'ٹماٹر',
    disease_slug: 'tomato_yellow_leaf_curl_virus',
    disease_name_en: 'Yellow Leaf Curl Virus',
    disease_name_ur: 'پیلے پتوں کا وائرس',
    default_severity: 'high',
    is_healthy: false,
  },
  'Tomato___Tomato_mosaic_virus': {
    crop_type_slug: 'tomato',
    crop_name_en: 'Tomato',
    crop_name_ur: 'ٹماٹر',
    disease_slug: 'tomato_mosaic_virus',
    disease_name_en: 'Mosaic Virus',
    disease_name_ur: 'موزیک وائرس',
    default_severity: 'high',
    is_healthy: false,
  },
  'Tomato___healthy': {
    crop_type_slug: 'tomato',
    crop_name_en: 'Tomato',
    crop_name_ur: 'ٹماٹر',
    disease_slug: 'healthy',
    disease_name_en: 'Healthy',
    disease_name_ur: 'صحت مند',
    default_severity: 'healthy',
    is_healthy: true,
  },

  // ─── Potato ────────────────────────────────────────────────────────────
  'Potato___Early_blight': {
    crop_type_slug: 'potato',
    crop_name_en: 'Potato',
    crop_name_ur: 'آلو',
    disease_slug: 'potato_early_blight',
    disease_name_en: 'Early Blight',
    disease_name_ur: 'ابتدائی جھلساؤ',
    default_severity: 'moderate',
    is_healthy: false,
  },
  'Potato___Late_blight': {
    crop_type_slug: 'potato',
    crop_name_en: 'Potato',
    crop_name_ur: 'آلو',
    disease_slug: 'potato_late_blight',
    disease_name_en: 'Late Blight',
    disease_name_ur: 'آخری جھلساؤ',
    default_severity: 'high',
    is_healthy: false,
  },
  'Potato___healthy': {
    crop_type_slug: 'potato',
    crop_name_en: 'Potato',
    crop_name_ur: 'آلو',
    disease_slug: 'healthy',
    disease_name_en: 'Healthy',
    disease_name_ur: 'صحت مند',
    default_severity: 'healthy',
    is_healthy: true,
  },

  // ─── Corn (Maize) ─────────────────────────────────────────────────────
  'Corn_(maize)___Cercospora_leaf_spot Gray_leaf_spot': {
    crop_type_slug: 'maize',
    crop_name_en: 'Maize',
    crop_name_ur: 'مکئی',
    disease_slug: 'maize_gray_leaf_spot',
    disease_name_en: 'Gray Leaf Spot',
    disease_name_ur: 'سرمئی پتوں کے داغ',
    default_severity: 'moderate',
    is_healthy: false,
  },
  'Corn_(maize)___Common_rust_': {
    crop_type_slug: 'maize',
    crop_name_en: 'Maize',
    crop_name_ur: 'مکئی',
    disease_slug: 'maize_common_rust',
    disease_name_en: 'Common Rust',
    disease_name_ur: 'عام زنگ',
    default_severity: 'moderate',
    is_healthy: false,
  },
  'Corn_(maize)___Northern_Leaf_Blight': {
    crop_type_slug: 'maize',
    crop_name_en: 'Maize',
    crop_name_ur: 'مکئی',
    disease_slug: 'maize_northern_leaf_blight',
    disease_name_en: 'Northern Leaf Blight',
    disease_name_ur: 'شمالی پتوں کا جھلساؤ',
    default_severity: 'high',
    is_healthy: false,
  },
  'Corn_(maize)___healthy': {
    crop_type_slug: 'maize',
    crop_name_en: 'Maize',
    crop_name_ur: 'مکئی',
    disease_slug: 'healthy',
    disease_name_en: 'Healthy',
    disease_name_ur: 'صحت مند',
    default_severity: 'healthy',
    is_healthy: true,
  },

  // ─── Pepper (Chilli) ──────────────────────────────────────────────────
  'Pepper,_bell___Bacterial_spot': {
    crop_type_slug: 'chilli',
    crop_name_en: 'Chilli Pepper',
    crop_name_ur: 'مرچ',
    disease_slug: 'chilli_bacterial_spot',
    disease_name_en: 'Bacterial Spot',
    disease_name_ur: 'بیکٹیریل داغ',
    default_severity: 'moderate',
    is_healthy: false,
  },
  'Pepper,_bell___healthy': {
    crop_type_slug: 'chilli',
    crop_name_en: 'Chilli Pepper',
    crop_name_ur: 'مرچ',
    disease_slug: 'healthy',
    disease_name_en: 'Healthy',
    disease_name_ur: 'صحت مند',
    default_severity: 'healthy',
    is_healthy: true,
  },

  // ─── Apple ─────────────────────────────────────────────────────────────
  'Apple___Apple_scab': {
    crop_type_slug: 'apple',
    crop_name_en: 'Apple',
    crop_name_ur: 'سیب',
    disease_slug: 'apple_scab',
    disease_name_en: 'Apple Scab',
    disease_name_ur: 'سیب کی خارش',
    default_severity: 'moderate',
    is_healthy: false,
  },
  'Apple___Black_rot': {
    crop_type_slug: 'apple',
    crop_name_en: 'Apple',
    crop_name_ur: 'سیب',
    disease_slug: 'apple_black_rot',
    disease_name_en: 'Black Rot',
    disease_name_ur: 'کالی سڑن',
    default_severity: 'high',
    is_healthy: false,
  },
  'Apple___Cedar_apple_rust': {
    crop_type_slug: 'apple',
    crop_name_en: 'Apple',
    crop_name_ur: 'سیب',
    disease_slug: 'apple_cedar_rust',
    disease_name_en: 'Cedar Apple Rust',
    disease_name_ur: 'دیودار سیب زنگ',
    default_severity: 'moderate',
    is_healthy: false,
  },
  'Apple___healthy': {
    crop_type_slug: 'apple',
    crop_name_en: 'Apple',
    crop_name_ur: 'سیب',
    disease_slug: 'healthy',
    disease_name_en: 'Healthy',
    disease_name_ur: 'صحت مند',
    default_severity: 'healthy',
    is_healthy: true,
  },

  // ─── Grape ─────────────────────────────────────────────────────────────
  'Grape___Black_rot': {
    crop_type_slug: 'grape',
    crop_name_en: 'Grape',
    crop_name_ur: 'انگور',
    disease_slug: 'grape_black_rot',
    disease_name_en: 'Black Rot',
    disease_name_ur: 'کالی سڑن',
    default_severity: 'high',
    is_healthy: false,
  },
  'Grape___Esca_(Black_Measles)': {
    crop_type_slug: 'grape',
    crop_name_en: 'Grape',
    crop_name_ur: 'انگور',
    disease_slug: 'grape_esca',
    disease_name_en: 'Esca (Black Measles)',
    disease_name_ur: 'ایسکا (کالا خسرہ)',
    default_severity: 'high',
    is_healthy: false,
  },
  'Grape___Leaf_blight_(Isariopsis_Leaf_Spot)': {
    crop_type_slug: 'grape',
    crop_name_en: 'Grape',
    crop_name_ur: 'انگور',
    disease_slug: 'grape_leaf_blight',
    disease_name_en: 'Leaf Blight',
    disease_name_ur: 'پتوں کا جھلساؤ',
    default_severity: 'moderate',
    is_healthy: false,
  },
  'Grape___healthy': {
    crop_type_slug: 'grape',
    crop_name_en: 'Grape',
    crop_name_ur: 'انگور',
    disease_slug: 'healthy',
    disease_name_en: 'Healthy',
    disease_name_ur: 'صحت مند',
    default_severity: 'healthy',
    is_healthy: true,
  },

  // ─── Cherry ────────────────────────────────────────────────────────────
  'Cherry_(including_sour)___Powdery_mildew': {
    crop_type_slug: 'cherry',
    crop_name_en: 'Cherry',
    crop_name_ur: 'چیری',
    disease_slug: 'cherry_powdery_mildew',
    disease_name_en: 'Powdery Mildew',
    disease_name_ur: 'پاؤڈری پھپھوندی',
    default_severity: 'moderate',
    is_healthy: false,
  },
  'Cherry_(including_sour)___healthy': {
    crop_type_slug: 'cherry',
    crop_name_en: 'Cherry',
    crop_name_ur: 'چیری',
    disease_slug: 'healthy',
    disease_name_en: 'Healthy',
    disease_name_ur: 'صحت مند',
    default_severity: 'healthy',
    is_healthy: true,
  },

  // ─── Peach ─────────────────────────────────────────────────────────────
  'Peach___Bacterial_spot': {
    crop_type_slug: 'peach',
    crop_name_en: 'Peach',
    crop_name_ur: 'آڑو',
    disease_slug: 'peach_bacterial_spot',
    disease_name_en: 'Bacterial Spot',
    disease_name_ur: 'بیکٹیریل داغ',
    default_severity: 'moderate',
    is_healthy: false,
  },
  'Peach___healthy': {
    crop_type_slug: 'peach',
    crop_name_en: 'Peach',
    crop_name_ur: 'آڑو',
    disease_slug: 'healthy',
    disease_name_en: 'Healthy',
    disease_name_ur: 'صحت مند',
    default_severity: 'healthy',
    is_healthy: true,
  },

  // ─── Strawberry ────────────────────────────────────────────────────────
  'Strawberry___Leaf_scorch': {
    crop_type_slug: 'strawberry',
    crop_name_en: 'Strawberry',
    crop_name_ur: 'اسٹرابیری',
    disease_slug: 'strawberry_leaf_scorch',
    disease_name_en: 'Leaf Scorch',
    disease_name_ur: 'پتوں کا جھلس',
    default_severity: 'moderate',
    is_healthy: false,
  },
  'Strawberry___healthy': {
    crop_type_slug: 'strawberry',
    crop_name_en: 'Strawberry',
    crop_name_ur: 'اسٹرابیری',
    disease_slug: 'healthy',
    disease_name_en: 'Healthy',
    disease_name_ur: 'صحت مند',
    default_severity: 'healthy',
    is_healthy: true,
  },

  // ─── Squash ────────────────────────────────────────────────────────────
  'Squash___Powdery_mildew': {
    crop_type_slug: 'squash',
    crop_name_en: 'Squash',
    crop_name_ur: 'کدو',
    disease_slug: 'squash_powdery_mildew',
    disease_name_en: 'Powdery Mildew',
    disease_name_ur: 'پاؤڈری پھپھوندی',
    default_severity: 'moderate',
    is_healthy: false,
  },

  // ─── Soybean ───────────────────────────────────────────────────────────
  'Soybean___healthy': {
    crop_type_slug: 'soybean',
    crop_name_en: 'Soybean',
    crop_name_ur: 'سویابین',
    disease_slug: 'healthy',
    disease_name_en: 'Healthy',
    disease_name_ur: 'صحت مند',
    default_severity: 'healthy',
    is_healthy: true,
  },

  // ─── Raspberry ─────────────────────────────────────────────────────────
  'Raspberry___healthy': {
    crop_type_slug: 'raspberry',
    crop_name_en: 'Raspberry',
    crop_name_ur: 'رس بھری',
    disease_slug: 'healthy',
    disease_name_en: 'Healthy',
    disease_name_ur: 'صحت مند',
    default_severity: 'healthy',
    is_healthy: true,
  },

  // ─── Blueberry ─────────────────────────────────────────────────────────
  'Blueberry___healthy': {
    crop_type_slug: 'blueberry',
    crop_name_en: 'Blueberry',
    crop_name_ur: 'بلو بیری',
    disease_slug: 'healthy',
    disease_name_en: 'Healthy',
    disease_name_ur: 'صحت مند',
    default_severity: 'healthy',
    is_healthy: true,
  },

  // ─── Orange ────────────────────────────────────────────────────────────
  'Orange___Haunglongbing_(Citrus_greening)': {
    crop_type_slug: 'orange',
    crop_name_en: 'Orange / Citrus',
    crop_name_ur: 'نارنگی / لیموں',
    disease_slug: 'citrus_greening',
    disease_name_en: 'Citrus Greening (HLB)',
    disease_name_ur: 'لیموں کا سبز مرض',
    default_severity: 'urgent',
    is_healthy: false,
  },
};

/**
 * Look up a HuggingFace model label and return the mapped disease info.
 * Returns null if the label is not recognized.
 */
export function resolveLabel(hfLabel: string): LabelMapping | null {
  // Try exact match first
  if (LABEL_MAP[hfLabel]) return LABEL_MAP[hfLabel];

  // Try case-insensitive match (HF sometimes varies casing)
  const lower = hfLabel.toLowerCase();
  for (const [key, value] of Object.entries(LABEL_MAP)) {
    if (key.toLowerCase() === lower) return value;
  }

  return null;
}

/**
 * Build a fallback mapping for an unrecognized label.
 * Tries to extract crop name and disease name from the label format "Crop___Disease".
 */
export function buildFallbackMapping(hfLabel: string): LabelMapping {
  const parts = hfLabel.split('___');
  const rawCrop = (parts[0] || 'Unknown').replace(/_/g, ' ').replace(/[(),]/g, '').trim();
  const rawDisease = (parts[1] || 'Unknown Disease').replace(/_/g, ' ').trim();
  const isHealthy = rawDisease.toLowerCase() === 'healthy';

  return {
    crop_type_slug: rawCrop.toLowerCase().replace(/\s+/g, '_'),
    crop_name_en: rawCrop,
    crop_name_ur: rawCrop, // Can't auto-translate; use English as fallback
    disease_slug: isHealthy ? 'healthy' : `${rawCrop.toLowerCase().replace(/\s+/g, '_')}_${rawDisease.toLowerCase().replace(/\s+/g, '_')}`,
    disease_name_en: isHealthy ? 'Healthy' : rawDisease,
    disease_name_ur: isHealthy ? 'صحت مند' : rawDisease,
    default_severity: isHealthy ? 'healthy' : 'moderate',
    is_healthy: isHealthy,
  };
}
