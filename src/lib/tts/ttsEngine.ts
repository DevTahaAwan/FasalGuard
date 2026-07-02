// 2-Tier TTS Engine — Web Speech API → Google Cloud TTS fallback
// Per user decision: removed Kokoro ONNX (too large for 3G), using GCloud TTS as Tier 2.
// Tier 1: Web Speech API (free, instant, device-native — works on most Android Chrome)
// Tier 2: /api/v1/tts/synthesize → Google Cloud TTS API (Urdu: ur-PK-Standard-A)

import type { Language } from '@/types/api';

// ─── State ────────────────────────────────────────────────────────────────────

let currentUtterance: SpeechSynthesisUtterance | null = null;
let currentAudio: HTMLAudioElement | null = null;

// ─── Tier 1: Web Speech API ───────────────────────────────────────────────────

/**
 * Check if Web Speech API supports the given language.
 * On most Android Chrome devices, Urdu (ur-PK) is available.
 * This is a best-effort check — actual support varies by device.
 */
function isSpeechApiAvailable(language: Language): boolean {
  if (typeof window === 'undefined' || !window.speechSynthesis) return false;

  const langTag = language === 'ur' ? 'ur-PK' : 'en-PK';
  const voices = window.speechSynthesis.getVoices();

  // If no voices loaded yet, assume available and let it try
  if (voices.length === 0) return true;

  return voices.some(
    (v) =>
      v.lang === langTag ||
      v.lang.startsWith(language) ||
      // Fallback: any available voice
      (language === 'en' && v.lang.startsWith('en'))
  );
}

function playWithSpeechApi(
  text: string,
  language: Language,
  onStart: () => void,
  onEnd: () => void,
  onError: () => void
): void {
  if (!('speechSynthesis' in window)) {
    onError();
    return;
  }

  const utterance = new SpeechSynthesisUtterance(text);
  utterance.rate = language === 'ur' ? 0.85 : 0.95;
  utterance.pitch = 1.0;
  utterance.volume = 1.0;

  // Explicitly loop through available voices to find the best match
  const voices = window.speechSynthesis.getVoices();
  let selectedVoice = voices.find(v => v.lang === 'ur-PK');

  if (!selectedVoice) {
    selectedVoice = voices.find(v => v.lang.startsWith('ur'));
  }

  if (!selectedVoice) {
    selectedVoice = voices.find(v => v.lang.startsWith('en'));
  }

  if (selectedVoice) {
    utterance.voice = selectedVoice;
    utterance.lang = selectedVoice.lang;
  } else {
    utterance.lang = language === 'ur' ? 'ur-PK' : 'en-US';
  }

  utterance.onstart = onStart;
  utterance.onend = onEnd;
  utterance.onerror = () => onError();

  currentUtterance = utterance;
  window.speechSynthesis.speak(utterance);
}

// ─── Tier 2: Google Cloud TTS ─────────────────────────────────────────────────

async function playWithCloudTTS(
  text: string,
  language: Language,
  onStart: () => void,
  onEnd: () => void,
  onError: () => void
): Promise<void> {
  onStart();

  try {
    const response = await fetch('/api/v1/tts/synthesize', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text, language }),
      signal: AbortSignal.timeout(15_000),
    });

    if (!response.ok) {
      throw new Error(`TTS API error: ${response.status}`);
    }

    const data = (await response.json()) as {
      success: boolean;
      data: { audio_base64: string; format: string };
    };

    if (!data.success || !data.data.audio_base64) {
      throw new Error('Invalid TTS response');
    }

    // Decode base64 audio and play via HTMLAudioElement
    const audioBlob = base64ToBlob(data.data.audio_base64, 'audio/mp3');
    const audioUrl = URL.createObjectURL(audioBlob);

    const audio = new Audio(audioUrl);
    currentAudio = audio;

    audio.onended = () => {
      URL.revokeObjectURL(audioUrl);
      onEnd();
    };

    audio.onerror = () => {
      URL.revokeObjectURL(audioUrl);
      onError();
    };

    await audio.play();
  } catch {
    onError();
  }
}

function base64ToBlob(base64: string, mimeType: string): Blob {
  const byteChars = atob(base64);
  const byteArrays: Uint8Array[] = [];

  for (let offset = 0; offset < byteChars.length; offset += 512) {
    const slice = byteChars.slice(offset, offset + 512);
    const byteNumbers = Array.from({ length: slice.length }, (_, i) =>
      slice.charCodeAt(i)
    );
    byteArrays.push(new Uint8Array(byteNumbers));
  }

  return new Blob(byteArrays as any[], { type: mimeType });
}

// ─── Public API ────────────────────────────────────────────────────────────────

export interface PlayOptions {
  text: string;
  language: Language;
  onStart?: () => void;
  onEnd?: () => void;
  onError?: () => void;
}

/**
 * Play TTS using the 2-tier fallback chain:
 * Tier 1 → Web Speech API (instant, free, works offline)
 * Tier 2 → Google Cloud TTS (fallback when Urdu voice unavailable)
 */
export async function playTTS(options: PlayOptions): Promise<void> {
  const {
    text,
    language,
    onStart = () => {},
    onEnd = () => {},
    onError = () => {},
  } = options;

  // Stop any currently playing audio first
  stopTTS();

  // Tier 1: Try Web Speech API
  if (isSpeechApiAvailable(language)) {
    try {
      await new Promise<void>((resolve, reject) => {
        playWithSpeechApi(
          text,
          language,
          onStart,
          () => {
            onEnd();
            resolve();
          },
          () => {
            reject(new Error('SpeechAPI error'));
          }
        );
      });
      return;
    } catch {
      // Speech API failed — fall through to Tier 2
      stopTTS();
    }
  }

  // Tier 2: Google Cloud TTS
  await playWithCloudTTS(text, language, onStart, onEnd, onError);
}

/**
 * Stop any currently playing TTS audio.
 */
export function stopTTS(): void {
  if (typeof window !== 'undefined' && window.speechSynthesis) {
    window.speechSynthesis.cancel();
  }
  currentUtterance = null;

  if (currentAudio) {
    currentAudio.pause();
    currentAudio = null;
  }
}
