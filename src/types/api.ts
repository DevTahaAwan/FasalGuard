// FasalGuard Type Definitions — API Layer
// All types match exactly the API response shapes defined in TRD §4.3
// Mock fetchers and real fetchers both return these types unchanged.

// ─── Generic API Envelopes ────────────────────────────────────────────────────

export interface ApiSuccessResponse<T> {
  success: true;
  data: T;
  meta?: {
    request_id?: string;
    processing_time_ms?: number;
    model_version?: string;
    total?: number;
    page?: number;
    limit?: number;
  };
}

export interface ApiErrorResponse {
  success: false;
  error: {
    code: string;
    message: string;
    message_ur: string;
    details?: Record<string, unknown>;
  };
}

export type ApiResponse<T> = ApiSuccessResponse<T> | ApiErrorResponse;

// ─── Enums (mirror database enum types from schema.sql) ───────────────────────

export type Language = 'ur' | 'en';

export type ScanMode = 'online' | 'offline';

export type ScanStatus = 'completed' | 'low_confidence' | 'failed' | 'pending_sync';

export type DiseaseSeverity = 'healthy' | 'low' | 'moderate' | 'high' | 'urgent';

export type AdvisoryType =
  | 'disease_treatment'
  | 'early_warning'
  | 'healthy_confirmation'
  | 'nutrient_deficiency'
  | 'pest_risk';

export type ProductType =
  | 'fungicide'
  | 'bactericide'
  | 'insecticide'
  | 'herbicide'
  | 'fertilizer'
  | 'bio_control';

export type UrgencyLevel = 'preventive' | 'within_week' | 'within_3_days' | 'today';

export type SyncStatus = 'pending' | 'in_progress' | 'synced' | 'failed' | 'conflict';

// ─── Crop Types ────────────────────────────────────────────────────────────────

export interface CropType {
  id: string;
  slug: string;
  name_en: string;
  name_ur: string;
  icon_filename: string;
  display_order: number;
  is_active: boolean;
  hf_dataset_class: string | null;
  season: string[];
}

export interface CropListResponse {
  crops: CropType[];
}

// ─── Disease & Products ────────────────────────────────────────────────────────

export interface ProductRecommendation {
  id: string;
  disease_record_id: string;
  product_type: ProductType;
  brand_name: string;
  active_ingredient: string | null;
  manufacturer: string | null;
  dpp_registration_no: string | null;
  dosage_en: string;
  dosage_ur: string;
  application_timing_en: string;
  application_timing_ur: string;
  safety_note_en: string | null;
  safety_note_ur: string | null;
  urgency: UrgencyLevel;
  is_primary: boolean;
  display_order: number;
  brand_name_ssml: string | null;
  is_active: boolean;
}

export interface DiseaseRecord {
  id: string;
  slug: string;
  name_en: string;
  name_ur: string;
  description_en: string;
  description_ur: string;
  default_severity: DiseaseSeverity;
  is_healthy: boolean;
  is_early_warning: boolean;
  advisory_type: AdvisoryType;
  is_active: boolean;
  products: ProductRecommendation[];
  crop_slugs: string[];
}

export interface DiseaseListResponse {
  diseases: DiseaseRecord[];
  etag: string;
}

// ─── Scan — Stage 1: Analyze ──────────────────────────────────────────────────

export interface ScanAnalyzeRequest {
  image: string; // base64 encoded JPEG/WebP/PNG
  crop_type: string; // crop slug
  language: Language;
}

export interface ScanAnalyzeResponse {
  scan_id: string;
  disease_label: string; // HF model label or 'healthy' or 'low_confidence'
  disease_slug: string; // internal disease_id
  confidence_score: number; // 0.00 – 1.00
  severity: DiseaseSeverity;
  is_healthy: boolean;
  risk_advisory_triggered: boolean;
  status: ScanStatus;
  // Confidence threshold classification
  confidence_level: 'high' | 'medium' | 'low'; // >=0.70 high; 0.40-0.69 medium; <0.40 low
  // Crop & disease display fields
  crop_type_slug?: string;
  crop_name_en?: string;
  crop_name_ur?: string;
  disease_name_en?: string;
  disease_name_ur?: string;
  scanned_at?: string; // ISO 8601 timestamp
}

// ─── Scan — Stage 2: Advisory ─────────────────────────────────────────────────

export interface AdvisoryRequest {
  scan_id: string;
  disease_label: string;
  disease_slug: string;
  crop_type: string;
  language: Language;
  severity: DiseaseSeverity;
}

export interface AdvisoryProduct {
  type: ProductType;
  name: string;
  dosage: string;
  application_timing: string;
  is_primary: boolean;
  brand_name_ssml: string | null;
}

export interface AdvisoryResponse {
  scan_id: string;
  disease_summary: string;
  severity_explanation: string;
  urgency_level: UrgencyLevel;
  advisory_type: AdvisoryType;
  products: AdvisoryProduct[];
  safety_note: string | null;
  full_advisory_text: string; // For TTS — complete readable advisory paragraph
}

// ─── Scan History ─────────────────────────────────────────────────────────────

export interface ScanHistoryItem {
  scan_id: string;
  crop_type_slug: string;
  crop_name_en: string;
  crop_name_ur: string;
  crop_icon_filename: string;
  disease_name_en: string | null;
  disease_name_ur: string | null;
  severity: DiseaseSeverity | null;
  is_healthy: boolean;
  confidence_score: number | null;
  scan_mode: ScanMode;
  language_at_scan: Language;
  scanned_at: string; // ISO timestamp
  image_url: string | null;
  advisory_type: AdvisoryType | null;
}

export interface HistoryListResponse {
  scans: ScanHistoryItem[];
  meta: {
    total: number;
    page: number;
    limit: number;
  };
}

export interface HistoryScanDetailResponse extends ScanHistoryItem {
  disease_description: string | null; // in language_at_scan
  advisory_text: string | null;
  products: AdvisoryProduct[];
  safety_note: string | null;
  full_advisory_text: string | null;
}

// ─── Sync ─────────────────────────────────────────────────────────────────────

export interface SyncRequest {
  scans: LocalScanRecord[];
}

export interface SyncResponse {
  synced_count: number;
  failed_ids: string[];
  conflicts: string[];
}

// Local IndexedDB scan record (Dexie)
export interface LocalScanRecord {
  id: string; // UUID
  crop_type_slug: string;
  crop_name_en: string;
  crop_name_ur: string;
  crop_icon_filename: string;
  disease_slug: string | null;
  disease_name_en: string | null;
  disease_name_ur: string | null;
  disease_description_en: string | null;
  disease_description_ur: string | null;
  severity: DiseaseSeverity | null;
  is_healthy: boolean;
  confidence_score: number | null;
  scan_mode: ScanMode;
  language_at_scan: Language;
  scanned_at: string;
  image_data_url: string | null; // base64 data URL, stored locally only
  image_url: string | null; // Supabase Storage URL after sync
  advisory_type: AdvisoryType | null;
  advisory_text: string | null;
  full_advisory_text: string | null;
  products: AdvisoryProduct[];
  safety_note: string | null;
  sync_status: SyncStatus;
  sync_attempts: number;
  last_sync_attempt: string | null;
}

// ─── TTS ──────────────────────────────────────────────────────────────────────

export interface TTSSynthesizeRequest {
  text: string;
  language: Language;
  ssml?: boolean;
}

export interface TTSSynthesizeResponse {
  audio_base64: string;
  format: 'mp3';
  duration_seconds: number;
}

// ─── User Profile ─────────────────────────────────────────────────────────────

export interface UserProfile {
  user_id: string;
  phone: string | null;
  language_preference: Language;
  crop_preferences: string[];
  onboarding_completed: boolean;
  offline_model_downloaded: boolean;
  total_scan_count: number;
  joined_at: string;
}

export interface UserProfileResponse {
  profile: UserProfile;
}

// ─── Auth ─────────────────────────────────────────────────────────────────────

export interface AnonymousSessionResponse {
  session_token: string;
  user_id: string;
}

export interface OtpSendResponse {
  message_sid: string;
  expires_at: string;
}

export interface OtpVerifyResponse {
  access_token: string;
  refresh_token: string;
  user_id: string;
}

// ─── Dealers (mock only — no backend API defined in TRD) ──────────────────────

export interface Dealer {
  id: string;
  name: string;
  name_ur: string;
  address: string;
  address_ur: string;
  city: string;
  phone: string;
  lat: number;
  lng: number;
  is_open: boolean;
  opening_hours: string;
  distance_km: number | null; // calculated at runtime from user location
  specialties: string[]; // e.g. ['fungicides', 'fertilizers']
}
