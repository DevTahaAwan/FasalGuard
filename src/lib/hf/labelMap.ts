// HuggingFace Label → FasalGuard Disease Mapping
// Model: linkanjarad/mobilenet_v2_1.0_224-plant-disease-identification
//
// This model outputs labels like "Tomato___Early_blight" or "Potato___healthy".
// We map each to our internal crop/disease structure with bilingual names.
//
// Wheat, Cotton, Rice, Sugarcane, Onion, and Mango entries below are NOT part of
// the original PlantVillage/HuggingFace label set — the source model was never
// trained on these crops. These entries exist so the SAME taxonomy can be reused
// as a constrained enum for the Gemini Vision replacement pipeline. Verified
// against peer-reviewed and Pakistan-specific agronomy sources as of July 2026.
// See conversation log for source-by-source verification notes and known gaps.

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

  // ═══════════════════════════════════════════════════════════════════════
  // BELOW: Pakistan-priority crops NOT covered by the original PlantVillage/
  // HuggingFace model. Verified against Pakistan-specific and peer-reviewed
  // sources (Punjab field surveys, DAWN.com, Pakistan Journal of Phytopathology,
  // agripunjab.gov.pk institute pages, PMC/ResearchGate publications).
  // Keys below are NOT HuggingFace labels — they follow the same "Crop___Disease"
  // convention for consistency and are the canonical enum values fed to Gemini's
  // structured output schema.
  // ═══════════════════════════════════════════════════════════════════════

  // ─── Wheat (گندم) ──────────────────────────────────────────────────────
  'Wheat___Leaf_rust': {
    crop_type_slug: 'wheat',
    crop_name_en: 'Wheat',
    crop_name_ur: 'گندم',
    disease_slug: 'wheat_leaf_rust',
    disease_name_en: 'Leaf Rust (Brown Rust)',
    disease_name_ur: 'پتوں کا زنگ (براؤن رسٹ)',
    default_severity: 'high',
    is_healthy: false,
  },
  'Wheat___Yellow_rust': {
    crop_type_slug: 'wheat',
    crop_name_en: 'Wheat',
    crop_name_ur: 'گندم',
    disease_slug: 'wheat_yellow_rust',
    disease_name_en: 'Yellow Rust (Stripe Rust)',
    disease_name_ur: 'پیلا زنگ (اسٹرائپ رسٹ)',
    default_severity: 'high',
    is_healthy: false,
  },
  'Wheat___Stem_rust': {
    crop_type_slug: 'wheat',
    crop_name_en: 'Wheat',
    crop_name_ur: 'گندم',
    disease_slug: 'wheat_stem_rust',
    disease_name_en: 'Stem Rust (Black Rust)',
    disease_name_ur: 'تنے کا زنگ (کالا زنگ)',
    default_severity: 'high',
    is_healthy: false,
  },
  'Wheat___Spot_blotch': {
    crop_type_slug: 'wheat',
    crop_name_en: 'Wheat',
    crop_name_ur: 'گندم',
    disease_slug: 'wheat_spot_blotch',
    disease_name_en: 'Spot Blotch',
    disease_name_ur: 'داغ دار جھلساؤ',
    default_severity: 'high',
    is_healthy: false,
  },
  'Wheat___Septoria_leaf_blotch': {
    crop_type_slug: 'wheat',
    crop_name_en: 'Wheat',
    crop_name_ur: 'گندم',
    disease_slug: 'wheat_septoria_leaf_blotch',
    disease_name_en: 'Septoria Leaf Blotch',
    disease_name_ur: 'سیپٹوریا پتوں کے دھبے',
    default_severity: 'moderate',
    is_healthy: false,
  },
  'Wheat___Powdery_mildew': {
    crop_type_slug: 'wheat',
    crop_name_en: 'Wheat',
    crop_name_ur: 'گندم',
    disease_slug: 'wheat_powdery_mildew',
    disease_name_en: 'Powdery Mildew',
    disease_name_ur: 'پاؤڈری پھپھوندی',
    default_severity: 'moderate',
    is_healthy: false,
  },
  'Wheat___Fusarium_head_blight': {
    crop_type_slug: 'wheat',
    crop_name_en: 'Wheat',
    crop_name_ur: 'گندم',
    disease_slug: 'wheat_fusarium_head_blight',
    disease_name_en: 'Fusarium Head Blight',
    disease_name_ur: 'فوزیریم بالی جھلساؤ',
    default_severity: 'high',
    is_healthy: false,
  },
  'Wheat___healthy': {
    crop_type_slug: 'wheat',
    crop_name_en: 'Wheat',
    crop_name_ur: 'گندم',
    disease_slug: 'healthy',
    disease_name_en: 'Healthy',
    disease_name_ur: 'صحت مند',
    default_severity: 'healthy',
    is_healthy: true,
  },

  // ─── Cotton (کپاس) ─────────────────────────────────────────────────────
  'Cotton___Cotton_leaf_curl_virus': {
    crop_type_slug: 'cotton',
    crop_name_en: 'Cotton',
    crop_name_ur: 'کپاس',
    disease_slug: 'cotton_leaf_curl_virus',
    disease_name_en: 'Cotton Leaf Curl Virus (CLCuV)',
    disease_name_ur: 'کاٹن لیف کرل وائرس',
    default_severity: 'urgent',
    is_healthy: false,
  },
  'Cotton___Bacterial_blight': {
    crop_type_slug: 'cotton',
    crop_name_en: 'Cotton',
    crop_name_ur: 'کپاس',
    disease_slug: 'cotton_bacterial_blight',
    disease_name_en: 'Bacterial Blight (Angular Leaf Spot)',
    disease_name_ur: 'بیکٹیریل جھلساؤ (کونیی پتہ دھبہ)',
    default_severity: 'high',
    is_healthy: false,
  },
  'Cotton___Boll_rot': {
    crop_type_slug: 'cotton',
    crop_name_en: 'Cotton',
    crop_name_ur: 'کپاس',
    disease_slug: 'cotton_boll_rot',
    disease_name_en: 'Boll Rot',
    disease_name_ur: 'بول گلا سڑ',
    default_severity: 'high',
    is_healthy: false,
  },
  'Cotton___Root_rot': {
    crop_type_slug: 'cotton',
    crop_name_en: 'Cotton',
    crop_name_ur: 'کپاس',
    disease_slug: 'cotton_root_rot',
    disease_name_en: 'Root Rot',
    disease_name_ur: 'جڑوں کی گلن',
    default_severity: 'high',
    is_healthy: false,
  },
  'Cotton___Verticillium_wilt': {
    crop_type_slug: 'cotton',
    crop_name_en: 'Cotton',
    crop_name_ur: 'کپاس',
    disease_slug: 'cotton_verticillium_wilt',
    disease_name_en: 'Verticillium Wilt',
    disease_name_ur: 'ورٹیسیلیم مرجھاؤ',
    default_severity: 'high',
    is_healthy: false,
  },
  'Cotton___Alternaria_leaf_spot': {
    crop_type_slug: 'cotton',
    crop_name_en: 'Cotton',
    crop_name_ur: 'کپاس',
    disease_slug: 'cotton_alternaria_leaf_spot',
    disease_name_en: 'Alternaria Leaf Spot',
    disease_name_ur: 'الٹرنیریا پتہ دھبہ',
    default_severity: 'moderate',
    is_healthy: false,
  },
  'Cotton___healthy': {
    crop_type_slug: 'cotton',
    crop_name_en: 'Cotton',
    crop_name_ur: 'کپاس',
    disease_slug: 'healthy',
    disease_name_en: 'Healthy',
    disease_name_ur: 'صحت مند',
    default_severity: 'healthy',
    is_healthy: true,
  },

  // ─── Rice / Paddy (چاول) ──────────────────────────────────────────────
  'Rice___Blast_disease': {
    crop_type_slug: 'rice',
    crop_name_en: 'Rice',
    crop_name_ur: 'چاول',
    disease_slug: 'rice_blast_disease',
    disease_name_en: 'Blast Disease',
    disease_name_ur: 'بلاسٹ بیماری (پتہ/گلہوّا جھلساؤ)',
    default_severity: 'high',
    is_healthy: false,
  },
  'Rice___Bacterial_leaf_blight': {
    crop_type_slug: 'rice',
    crop_name_en: 'Rice',
    crop_name_ur: 'چاول',
    disease_slug: 'rice_bacterial_leaf_blight',
    disease_name_en: 'Bacterial Leaf Blight',
    disease_name_ur: 'بیکٹیریل پتہ جھلساؤ',
    default_severity: 'high',
    is_healthy: false,
  },
  'Rice___Sheath_blight': {
    crop_type_slug: 'rice',
    crop_name_en: 'Rice',
    crop_name_ur: 'چاول',
    disease_slug: 'rice_sheath_blight',
    disease_name_en: 'Sheath Blight',
    disease_name_ur: 'شیٹھ جھلساؤ',
    default_severity: 'moderate',
    is_healthy: false,
  },
  'Rice___Brown_spot': {
    crop_type_slug: 'rice',
    crop_name_en: 'Rice',
    crop_name_ur: 'چاول',
    disease_slug: 'rice_brown_spot',
    disease_name_en: 'Brown Spot',
    disease_name_ur: 'براون دھبہ',
    default_severity: 'moderate',
    is_healthy: false,
  },
  'Rice___False_smut': {
    crop_type_slug: 'rice',
    crop_name_en: 'Rice',
    crop_name_ur: 'چاول',
    disease_slug: 'rice_false_smut',
    disease_name_en: 'False Smut',
    disease_name_ur: 'فالس اسمت (جھوٹی گند)',
    default_severity: 'moderate',
    is_healthy: false,
  },
  'Rice___healthy': {
    crop_type_slug: 'rice',
    crop_name_en: 'Rice',
    crop_name_ur: 'چاول',
    disease_slug: 'healthy',
    disease_name_en: 'Healthy',
    disease_name_ur: 'صحت مند',
    default_severity: 'healthy',
    is_healthy: true,
  },

  // ─── Sugarcane (گنا) ──────────────────────────────────────────────────
  'Sugarcane___Red_rot': {
    crop_type_slug: 'sugarcane',
    crop_name_en: 'Sugarcane',
    crop_name_ur: 'گنا',
    disease_slug: 'sugarcane_red_rot',
    disease_name_en: 'Red Rot',
    disease_name_ur: 'ریڈ روٹ (گنا سرخ سڑن)',
    default_severity: 'high',
    is_healthy: false,
  },
  'Sugarcane___Whip_smut': {
    crop_type_slug: 'sugarcane',
    crop_name_en: 'Sugarcane',
    crop_name_ur: 'گنا',
    disease_slug: 'sugarcane_whip_smut',
    disease_name_en: 'Whip Smut',
    disease_name_ur: 'وہپ اسمت (کوڑا نما گند)',
    default_severity: 'high',
    is_healthy: false,
  },
  'Sugarcane___Rust_disease': {
    crop_type_slug: 'sugarcane',
    crop_name_en: 'Sugarcane',
    crop_name_ur: 'گنا',
    disease_slug: 'sugarcane_rust_disease',
    disease_name_en: 'Rust Disease',
    disease_name_ur: 'گنے کا زنگ',
    default_severity: 'moderate',
    is_healthy: false,
  },
  'Sugarcane___Pokkah_boeng': {
    crop_type_slug: 'sugarcane',
    crop_name_en: 'Sugarcane',
    crop_name_ur: 'گنا',
    disease_slug: 'sugarcane_pokkah_boeng',
    disease_name_en: 'Pokkah Boeng',
    disease_name_ur: 'پوکہ بونگ (پتے مڑھاؤ بیماری)',
    default_severity: 'moderate',
    is_healthy: false,
  },
  'Sugarcane___healthy': {
    crop_type_slug: 'sugarcane',
    crop_name_en: 'Sugarcane',
    crop_name_ur: 'گنا',
    disease_slug: 'healthy',
    disease_name_en: 'Healthy',
    disease_name_ur: 'صحت مند',
    default_severity: 'healthy',
    is_healthy: true,
  },

  // ─── Onion (پیاز) ─────────────────────────────────────────────────────
  // NOTE: "Black Mold" (Aspergillus niger) intentionally excluded here.
  // It is a real, globally documented onion pathogen, but it did NOT surface
  // as a Pakistan-specific priority disease in the sources checked (DAWN.com's
  // Pakistan-focused writeup names downy mildew, purple blotch, grey mold, and
  // basal/pink rot as the four most destructive). Re-add only after a direct
  // Pakistan-specific source confirms field relevance — do not restore from
  // memory or a second AI-generated list.
  'Onion___Downy_mildew': {
    crop_type_slug: 'onion',
    crop_name_en: 'Onion',
    crop_name_ur: 'پیاز',
    disease_slug: 'onion_downy_mildew',
    disease_name_en: 'Downy Mildew',
    disease_name_ur: 'ڈاؤنی پھپھوندی',
    default_severity: 'moderate',
    is_healthy: false,
  },
  'Onion___Purple_blotch': {
    crop_type_slug: 'onion',
    crop_name_en: 'Onion',
    crop_name_ur: 'پیاز',
    disease_slug: 'onion_purple_blotch',
    disease_name_en: 'Purple Blotch',
    disease_name_ur: 'ارغوانی دھبہ بیماری',
    default_severity: 'moderate',
    is_healthy: false,
  },
  'Onion___Grey_mold': {
    crop_type_slug: 'onion',
    crop_name_en: 'Onion',
    crop_name_ur: 'پیاز',
    disease_slug: 'onion_grey_mold',
    disease_name_en: 'Grey Mold (Neck Rot)',
    disease_name_ur: 'گرے مولڈ (گردن کی سڑن)',
    default_severity: 'high',
    is_healthy: false,
  },
  'Onion___Basal_rot': {
    crop_type_slug: 'onion',
    crop_name_en: 'Onion',
    crop_name_ur: 'پیاز',
    disease_slug: 'onion_basal_rot',
    disease_name_en: 'Basal Rot (Pink Rot)',
    disease_name_ur: 'جڑ یا نچلی سڑن (پنک روٹ)',
    default_severity: 'high',
    is_healthy: false,
  },
  'Onion___healthy': {
    crop_type_slug: 'onion',
    crop_name_en: 'Onion',
    crop_name_ur: 'پیاز',
    disease_slug: 'healthy',
    disease_name_en: 'Healthy',
    disease_name_ur: 'صحت مند',
    default_severity: 'healthy',
    is_healthy: true,
  },

  // ─── Mango (آم) ───────────────────────────────────────────────────────
  'Mango___Anthracnose': {
    crop_type_slug: 'mango',
    crop_name_en: 'Mango',
    crop_name_ur: 'آم',
    disease_slug: 'mango_anthracnose',
    disease_name_en: 'Anthracnose',
    disease_name_ur: 'اینٹھراکنوز (دھبہ/سڑن بیماری)',
    default_severity: 'high',
    is_healthy: false,
  },
  'Mango___Powdery_mildew': {
    crop_type_slug: 'mango',
    crop_name_en: 'Mango',
    crop_name_ur: 'آم',
    disease_slug: 'mango_powdery_mildew',
    disease_name_en: 'Powdery Mildew',
    disease_name_ur: 'پاؤڈری پھپھوندی',
    default_severity: 'high',
    is_healthy: false,
  },
  'Mango___Bacterial_black_spot': {
    crop_type_slug: 'mango',
    crop_name_en: 'Mango',
    crop_name_ur: 'آم',
    disease_slug: 'mango_bacterial_black_spot',
    disease_name_en: 'Bacterial Black Spot',
    disease_name_ur: 'بیکٹیریل کالا دھبہ',
    default_severity: 'moderate',
    is_healthy: false,
  },
  'Mango___Dieback': {
    crop_type_slug: 'mango',
    crop_name_en: 'Mango',
    crop_name_ur: 'آم',
    disease_slug: 'mango_dieback',
    disease_name_en: 'Dieback',
    disease_name_ur: 'ڈائبیک (شاخوں کا سوکھ جانا)',
    default_severity: 'high',
    is_healthy: false,
  },
  'Mango___Malformation': {
    crop_type_slug: 'mango',
    crop_name_en: 'Mango',
    crop_name_ur: 'آم',
    disease_slug: 'mango_malformation',
    disease_name_en: 'Mango Malformation',
    disease_name_ur: 'آم کی بگاڑ بیماری',
    default_severity: 'moderate',
    is_healthy: false,
  },
  'Mango___Sudden_death_syndrome': {
    crop_type_slug: 'mango',
    crop_name_en: 'Mango',
    crop_name_ur: 'آم',
    disease_slug: 'mango_sudden_death_syndrome',
    disease_name_en: 'Mango Sudden Death Syndrome (MSDS)',
    disease_name_ur: 'آم اچانک مرجھاؤ/موت سنڈروم',
    default_severity: 'urgent',
    is_healthy: false,
  },
  'Mango___healthy': {
    crop_type_slug: 'mango',
    crop_name_en: 'Mango',
    crop_name_ur: 'آم',
    disease_slug: 'healthy',
    disease_name_en: 'Healthy',
    disease_name_ur: 'صحت مند',
    default_severity: 'healthy',
    is_healthy: true,
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

/**
 * Returns every disease_slug in the taxonomy as a flat array.
 * Use this to build the Gemini structured-output enum constraint —
 * Gemini must only ever return one of these values, never invent new ones.
 */
export function getAllDiseaseSlugs(): string[] {
  const slugs = new Set<string>();
  for (const mapping of Object.values(LABEL_MAP)) {
    slugs.add(mapping.disease_slug);
  }
  return Array.from(slugs);
}

/**
 * Returns every crop_type_slug in the taxonomy as a flat array.
 * Use this to build the Gemini structured-output enum constraint for crop
 * identification, and to validate that a scanned crop is one FasalGuard
 * actually supports before running full disease classification.
 */
export function getAllCropSlugs(): string[] {
  const slugs = new Set<string>();
  for (const mapping of Object.values(LABEL_MAP)) {
    slugs.add(mapping.crop_type_slug);
  }
  return Array.from(slugs);
}

/**
 * Find a mapping by its disease_slug value directly (e.g. "wheat_yellow_rust"),
 * as opposed to resolveLabel() which expects the original HuggingFace-style
 * "Crop___Disease" key format.
 *
 * Used by the Gemini route: Gemini's structured output returns disease_slug
 * values directly (constrained via getAllDiseaseSlugs()), so this is the
 * correct reverse lookup to convert that back into a full bilingual mapping.
 *
 * "healthy" is a shared slug across every crop, so when looking up a healthy
 * result you MUST also pass cropSlug to disambiguate which crop's healthy
 * entry to return.
 */
export function findMappingByDiseaseSlug(
  diseaseSlug: string,
  cropSlug?: string,
): LabelMapping | null {
  const allMappings = Object.values(LABEL_MAP);
  return (
    allMappings.find(
      (m) => m.disease_slug === diseaseSlug && (cropSlug ? m.crop_type_slug === cropSlug : true),
    ) ?? null
  );
}