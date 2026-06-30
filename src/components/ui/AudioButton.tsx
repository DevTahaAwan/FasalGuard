'use client';

import React, { useState, useCallback } from 'react';
import { Volume2, VolumeX, Loader2 } from 'lucide-react';
import { playTTS, stopTTS } from '@/lib/tts/ttsEngine';
import type { Language } from '@/types/api';

// ─── AudioButton Props ─────────────────────────────────────────────────────────

export interface AudioButtonProps {
  text: string;
  language: Language;
  /** Aria label for screen readers */
  label?: string;
  className?: string;
  size?: 'sm' | 'md';
}

type PlayState = 'idle' | 'loading' | 'playing';

// ─── AudioButton Component ────────────────────────────────────────────────────
//
// DESIGN RULE (design.json doNot[0,1]):
//   - In Urdu (RTL): audio button is positioned on the LEFT side of text
//   - In English (LTR): audio button is positioned on the RIGHT side of text
// This is enforced by the parent (TreatmentCard etc.) using flex-row-reverse in RTL.
// AudioButton itself is just a circular icon button.

export const AudioButton: React.FC<AudioButtonProps> = ({
  text,
  language,
  label = 'Listen',
  className = '',
  size = 'md',
}) => {
  const [playState, setPlayState] = useState<PlayState>('idle');

  const sizeClasses =
    size === 'sm'
      ? 'h-10 w-10 min-h-touch-secondary min-w-touch-secondary'
      : 'h-12 w-12 min-h-touch-secondary min-w-touch-secondary';

  const handlePlay = useCallback(async () => {
    if (playState === 'playing') {
      stopTTS();
      setPlayState('idle');
      return;
    }

    setPlayState('loading');

    await playTTS({
      text,
      language,
      onStart: () => setPlayState('playing'),
      onEnd: () => setPlayState('idle'),
      onError: () => setPlayState('idle'),
    });
  }, [playState, text, language]);

  const Icon =
    playState === 'loading'
      ? Loader2
      : playState === 'playing'
      ? VolumeX
      : Volume2;

  return (
    <button
      type="button"
      onClick={handlePlay}
      aria-label={playState === 'playing' ? 'Stop' : label}
      aria-pressed={playState === 'playing'}
      className={[
        'flex items-center justify-center rounded-full',
        'bg-brand-primary text-text-inverse',
        'hover:bg-brand-hover active:bg-brand-active',
        'focus-visible:ring-2 focus-visible:ring-brand-primary focus-visible:ring-offset-2',
        'transition-all duration-fast outline-none',
        // Pulsing ring when playing
        playState === 'playing'
          ? 'ring-4 ring-brand-subtle ring-offset-2 animate-pulse'
          : '',
        sizeClasses,
        className,
      ]
        .filter(Boolean)
        .join(' ')}
    >
      <Icon
        className={[
          'flex-shrink-0',
          size === 'sm' ? 'h-4 w-4' : 'h-5 w-5',
          playState === 'loading' ? 'animate-spin' : '',
        ]
          .filter(Boolean)
          .join(' ')}
        aria-hidden="true"
      />
    </button>
  );
};
