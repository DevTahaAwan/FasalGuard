'use client';

import React, { useState, useEffect } from 'react';

function formatTime(date: Date): string {
  let hours = date.getHours();
  const minutes = date.getMinutes();
  const ampm = hours >= 12 ? 'PM' : 'AM';
  hours = hours % 12;
  if (hours === 0) hours = 12;
  const mm = minutes < 10 ? `0${minutes}` : `${minutes}`;
  return `${hours}:${mm} ${ampm}`;
}

interface StatusBarProps {
  /** Override background color (e.g., '#000' for camera screen) */
  background?: string;
  /** Override text color */
  color?: string;
  /** Optional right-side label override (defaults to 'WiFi / Batt') */
  rightLabel?: string;
}

export function StatusBar({ background, color, rightLabel }: StatusBarProps) {
  const [time, setTime] = useState<string>('');

  useEffect(() => {
    // Set immediately on mount
    setTime(formatTime(new Date()));

    // Update every 15 seconds for a responsive clock without excessive re-renders
    const interval = setInterval(() => {
      setTime(formatTime(new Date()));
    }, 15_000);

    return () => clearInterval(interval);
  }, []);

  // Don't render until we have a time (avoids hydration mismatch)
  if (!time) return <div className="status-bar" style={{ background }} />;

  return (
    <div className="status-bar" style={background ? { background } : undefined}>
      <span dir="ltr" className="inline-block text-sm font-bold" style={color ? { color } : undefined}>{time}</span>
      <span style={color ? { color } : undefined}>{rightLabel ?? 'WiFi / Batt'}</span>
    </div>
  );
}
