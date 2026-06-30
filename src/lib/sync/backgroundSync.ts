// Background sync layer — bridges Dexie.js offline queue → Supabase cloud
// This module handles the sync lifecycle as described in user feedback:
// TanStack Query mutations fall back to Dexie syncQueue when offline.
// When the 'online' event fires, this module replays pending sync items.

import { getPendingSyncItems, markSynced, markSyncFailed } from '@/lib/db';

// ─── Sync Result ──────────────────────────────────────────────────────────────

interface SyncResult {
  synced: number;
  failed: number;
  errors: { id: string; message: string }[];
}

// ─── Core Sync Function ───────────────────────────────────────────────────────

/**
 * Replays all pending offline scan records to the server.
 * Called when:
 *   1. The browser fires the 'online' event
 *   2. The user manually triggers sync from the history screen
 *   3. The Service Worker's background sync event fires (tag: 'sync-scans')
 */
export async function syncPendingScans(
  accessToken: string | null
): Promise<SyncResult> {
  const result: SyncResult = { synced: 0, failed: 0, errors: [] };

  // Cannot sync without auth token — leave as pending
  if (!accessToken) {
    return result;
  }

  let pendingItems;
  try {
    pendingItems = await getPendingSyncItems();
  } catch {
    return result;
  }

  if (pendingItems.length === 0) {
    return result;
  }

  // Batch sync all pending items
  const scansPayload = pendingItems.map((item) => item.payload);

  try {
    const response = await fetch('/api/v1/history/sync', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${accessToken}`,
      },
      body: JSON.stringify({ scans: scansPayload }),
      signal: AbortSignal.timeout(30_000), // 30s timeout
    });

    if (!response.ok) {
      // Server-side failure — mark all as failed
      const errorMsg = `HTTP ${response.status}`;
      for (const item of pendingItems) {
        await markSyncFailed(item.id, errorMsg);
        result.failed++;
        result.errors.push({ id: item.id, message: errorMsg });
      }
      return result;
    }

    const data = await response.json() as {
      success: boolean;
      data: {
        synced_count: number;
        failed_ids: string[];
        conflicts: string[];
      };
    };

    if (!data.success) {
      throw new Error('Sync API returned success: false');
    }

    const { failed_ids, conflicts } = data.data;
    const failedSet = new Set([...failed_ids, ...conflicts]);

    // Mark individually succeeded/failed
    for (const item of pendingItems) {
      if (failedSet.has(item.scan_id)) {
        await markSyncFailed(item.id, 'Server rejected this scan record');
        result.failed++;
        result.errors.push({ id: item.id, message: 'Server rejected' });
      } else {
        await markSynced(item.id);
        result.synced++;
      }
    }
  } catch (err) {
    const errorMsg = err instanceof Error ? err.message : 'Unknown sync error';
    for (const item of pendingItems) {
      await markSyncFailed(item.id, errorMsg);
      result.failed++;
      result.errors.push({ id: item.id, message: errorMsg });
    }
  }

  return result;
}

// ─── Online Event Listener ─────────────────────────────────────────────────────

type SyncCallback = (result: SyncResult) => void;

let syncListenerAttached = false;
let onSyncComplete: SyncCallback | null = null;

/**
 * Attach the 'online' event listener once (idempotent).
 * Provide a callback to receive sync results (e.g., to update UI toast).
 */
export function attachOnlineSyncListener(
  getAccessToken: () => string | null,
  callback?: SyncCallback
): void {
  if (syncListenerAttached) return;
  syncListenerAttached = true;

  if (callback) {
    onSyncComplete = callback;
  }

  window.addEventListener('online', async () => {
    const token = getAccessToken();
    const result = await syncPendingScans(token);
    onSyncComplete?.(result);
  });
}

/**
 * Remove the sync listener (call on unmount/cleanup if needed).
 */
export function detachOnlineSyncListener(): void {
  syncListenerAttached = false;
  onSyncComplete = null;
}
