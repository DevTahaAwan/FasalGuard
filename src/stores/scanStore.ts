'use client';

import { create } from 'zustand';
import type { ScanAnalyzeResponse, AdvisoryResponse, Language, DiseaseSeverity } from '@/types/api';

// ─── Scan State Shape ─────────────────────────────────────────────────────────

type ScanPhase =
  | 'idle'
  | 'capturing' // Camera active, waiting for capture
  | 'validating' // Image validation (size, brightness)
  | 'analyzing' // Stage 1: HF MobileNetV2 inference
  | 'advisory' // Stage 2: Gemini advisory generation
  | 'complete' // Full result available
  | 'error';

export type ScanErrorCode =
  | 'CAMERA_DENIED'
  | 'IMAGE_TOO_DARK'
  | 'IMAGE_TOO_SMALL'
  | 'IMAGE_INVALID_FORMAT'
  | 'LOW_CONFIDENCE'
  | 'API_ERROR'
  | 'NETWORK_ERROR'
  | 'RATE_LIMITED'
  | 'NOT_A_PLANT'
  | 'MISSING_IMAGE'
  | 'PARSE_ERROR'
  | 'UNKNOWN';

interface ScanState {
  phase: ScanPhase;
  errorCode: ScanErrorCode | null;
  errorMessage: string | null;
  // Captured image
  capturedImageDataUrl: string | null;
  selectedCropSlug: string | null;
  language: Language;
  // Stage 1 result
  analyzeResult: ScanAnalyzeResponse | null;
  // Stage 2 result
  advisoryResult: AdvisoryResponse | null;
  // Current scan ID (for linking analyze → advisory)
  currentScanId: string | null;
}

interface ScanActions {
  startCapture: (language: Language) => void;
  setSelectedCrop: (slug: string) => void;
  setCapturedImage: (dataUrl: string) => void;
  setValidating: () => void;
  setAnalyzing: () => void;
  setAnalyzeResult: (result: ScanAnalyzeResponse) => void;
  setAdvisoryLoading: () => void;
  setAdvisoryResult: (result: AdvisoryResponse) => void;
  setError: (code: ScanErrorCode, message: string) => void;
  reset: () => void;
}

type ScanStore = ScanState & ScanActions;

// ─── Initial State ─────────────────────────────────────────────────────────────

const INITIAL_STATE: ScanState = {
  phase: 'idle',
  errorCode: null,
  errorMessage: null,
  capturedImageDataUrl: null,
  selectedCropSlug: null,
  language: 'ur',
  analyzeResult: null,
  advisoryResult: null,
  currentScanId: null,
};

// ─── Store ────────────────────────────────────────────────────────────────────

export const useScanStore = create<ScanStore>()((set, get) => ({
  ...INITIAL_STATE,

  startCapture: (language) =>
    set({ ...INITIAL_STATE, phase: 'capturing', language }),

  setSelectedCrop: (selectedCropSlug) => set({ selectedCropSlug }),

  setCapturedImage: (capturedImageDataUrl) => set({ capturedImageDataUrl }),

  setValidating: () => set({ phase: 'validating' }),

  setAnalyzing: () => set({ phase: 'analyzing' }),

  setAnalyzeResult: (result) =>
    set({
      analyzeResult: result,
      currentScanId: result.scan_id,
      phase: result.status === 'low_confidence' ? 'error' : 'advisory',
      errorCode:
        result.status === 'low_confidence' ? 'LOW_CONFIDENCE' : null,
      errorMessage:
        result.status === 'low_confidence'
          ? 'Confidence too low. Please retake the photo in better lighting.'
          : null,
    }),

  setAdvisoryLoading: () => set({ phase: 'advisory' }),

  setAdvisoryResult: (result) =>
    set({
      advisoryResult: result,
      phase: 'complete',
    }),

  setError: (errorCode, errorMessage) =>
    set({ phase: 'error', errorCode, errorMessage }),

  reset: () => set({ ...INITIAL_STATE }),
}));
