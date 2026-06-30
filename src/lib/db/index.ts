import Dexie, { Table } from 'dexie';
import type { LocalScanRecord, SyncStatus } from '@/types/api';

// ─── Disease Cache Record (offline bundle) ─────────────────────────────────────

export interface CachedDiseaseRecord {
  id: string;
  slug: string;
  name_en: string;
  name_ur: string;
  description_en: string;
  description_ur: string;
  default_severity: string;
  is_healthy: boolean;
  advisory_type: string;
  products: {
    id: string;
    brand_name: string;
    dosage_en: string;
    dosage_ur: string;
    application_timing_en: string;
    application_timing_ur: string;
    safety_note_en: string | null;
    safety_note_ur: string | null;
    urgency: string;
    is_primary: boolean;
  }[];
  crop_slugs: string[];
  cached_at: number; // Unix timestamp
}

// ─── Cached Crop Record ────────────────────────────────────────────────────────

export interface CachedCropRecord {
  id: string;
  slug: string;
  name_en: string;
  name_ur: string;
  icon_filename: string;
  display_order: number;
  hf_dataset_class: string | null;
  season: string[];
  cached_at: number;
}

// ─── Sync Queue Record ─────────────────────────────────────────────────────────

export interface SyncQueueRecord {
  id: string; // same as scan_records id
  scan_id: string;
  payload: LocalScanRecord;
  created_at: number;
  sync_status: SyncStatus;
  sync_attempts: number;
  last_attempt_at: number | null;
  error_message: string | null;
}

// ─── App Metadata ──────────────────────────────────────────────────────────────

export interface AppMetadata {
  key: string;
  value: string;
  updated_at: number;
}

// ─── FasalGuard Dexie Database ────────────────────────────────────────────────

export class FasalGuardDB extends Dexie {
  // Tables
  scans!: Table<LocalScanRecord>;
  diseases!: Table<CachedDiseaseRecord>;
  crops!: Table<CachedCropRecord>;
  syncQueue!: Table<SyncQueueRecord>;
  metadata!: Table<AppMetadata>;

  constructor() {
    super('FasalGuardDB');

    this.version(1).stores({
      // Local scan records (history)
      scans: 'id, crop_type_slug, scanned_at, sync_status, severity, is_healthy',

      // Cached disease knowledge base (offline AI fallback)
      diseases: 'id, slug, is_healthy, &slug',

      // Cached crop types
      crops: 'id, slug, display_order, &slug',

      // Background sync queue
      syncQueue: 'id, scan_id, sync_status, created_at, sync_attempts',

      // App-level metadata (e.g. last disease cache ETag)
      metadata: 'key',
    });
  }
}

// ─── Singleton Instance ───────────────────────────────────────────────────────

let db: FasalGuardDB | null = null;

export function getDB(): FasalGuardDB {
  if (!db) {
    db = new FasalGuardDB();
  }
  return db;
}

// ─── Helper Utilities ──────────────────────────────────────────────────────────

/** Get a metadata value by key */
export async function getMetadata(key: string): Promise<string | null> {
  const record = await getDB().metadata.get(key);
  return record?.value ?? null;
}

/** Set a metadata value */
export async function setMetadata(key: string, value: string): Promise<void> {
  await getDB().metadata.put({ key, value, updated_at: Date.now() });
}

/** Add a scan to the local database and sync queue if needed */
export async function saveLocalScan(scan: LocalScanRecord): Promise<void> {
  await getDB().scans.put(scan);

  // If this scan was created offline, add to sync queue
  if (scan.sync_status === 'pending') {
    await getDB().syncQueue.put({
      id: scan.id,
      scan_id: scan.id,
      payload: scan,
      created_at: Date.now(),
      sync_status: 'pending',
      sync_attempts: 0,
      last_attempt_at: null,
      error_message: null,
    });
  }
}

/** Get all scans ordered by scanned_at descending */
export async function getLocalScans(limit = 50): Promise<LocalScanRecord[]> {
  return getDB()
    .scans.orderBy('scanned_at')
    .reverse()
    .limit(limit)
    .toArray();
}

/** Get a disease record by slug for offline advisory */
export async function getDiseaseBySlug(
  slug: string
): Promise<CachedDiseaseRecord | undefined> {
  return getDB().diseases.where('slug').equals(slug).first();
}

/** Get pending sync queue items */
export async function getPendingSyncItems(): Promise<SyncQueueRecord[]> {
  return getDB()
    .syncQueue.where('sync_status')
    .anyOf(['pending', 'failed'])
    .and((item) => item.sync_attempts < 5) // Max 5 retry attempts
    .toArray();
}

/** Mark a sync queue item as synced */
export async function markSynced(syncId: string): Promise<void> {
  await getDB().syncQueue.update(syncId, { sync_status: 'synced' });
  await getDB().scans.where('id').equals(syncId).modify({ sync_status: 'synced' });
}

/** Mark a sync queue item as failed */
export async function markSyncFailed(
  syncId: string,
  errorMessage: string
): Promise<void> {
  await getDB()
    .syncQueue.where('id')
    .equals(syncId)
    .modify((item) => {
      item.sync_status = 'failed';
      item.sync_attempts += 1;
      item.last_attempt_at = Date.now();
      item.error_message = errorMessage;
    });
}
