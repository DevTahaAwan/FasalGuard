'use client';

import React from 'react';

// ─── Skeleton Base ─────────────────────────────────────────────────────────────

interface SkeletonProps {
  className?: string;
}

const Skeleton: React.FC<SkeletonProps> = ({ className = '' }) => (
  <div
    className={[
      'animate-pulse rounded-lg bg-skeleton-base',
      className,
    ].join(' ')}
    aria-hidden="true"
  />
);

// ─── Scan History Item Skeleton ───────────────────────────────────────────────

export const ScanHistoryItemSkeleton: React.FC = () => (
  <div className="flex items-center gap-3 px-4 py-3 bg-bg-tertiary rounded-xl border border-border-subtle">
    {/* Crop icon */}
    <Skeleton className="h-12 w-12 rounded-lg flex-shrink-0" />
    <div className="flex-1 min-w-0 space-y-2">
      {/* Disease name */}
      <Skeleton className="h-4 w-3/4" />
      {/* Date */}
      <Skeleton className="h-3 w-1/2" />
    </div>
    {/* Severity badge */}
    <Skeleton className="h-6 w-16 rounded-full flex-shrink-0" />
  </div>
);

// ─── Crop Card Skeleton ────────────────────────────────────────────────────────

export const CropCardSkeleton: React.FC = () => (
  <div className="flex flex-col items-center gap-2 p-3 bg-bg-tertiary rounded-xl border border-border-subtle min-h-touch-primary">
    {/* Icon */}
    <Skeleton className="h-10 w-10 rounded-lg" />
    {/* Name */}
    <Skeleton className="h-3 w-12" />
  </div>
);

// ─── Diagnosis Result Skeleton ─────────────────────────────────────────────────

export const DiagnosisResultSkeleton: React.FC = () => (
  <div className="space-y-4 px-4">
    {/* Severity header */}
    <div className="bg-bg-tertiary rounded-2xl p-4 space-y-3">
      <Skeleton className="h-6 w-24 rounded-full" /> {/* Severity badge */}
      <Skeleton className="h-6 w-3/4" /> {/* Disease name */}
      <Skeleton className="h-4 w-1/2" /> {/* Confidence */}
    </div>

    {/* Treatment card */}
    <div className="bg-success-subtle rounded-2xl p-4 space-y-3">
      <Skeleton className="h-5 w-1/2" />
      <Skeleton className="h-4 w-full" />
      <Skeleton className="h-4 w-5/6" />
      <Skeleton className="h-4 w-2/3" />
    </div>

    {/* Action buttons */}
    <Skeleton className="h-14 w-full rounded-xl" />
    <Skeleton className="h-14 w-full rounded-xl" />
  </div>
);

// ─── Dealer Card Skeleton ──────────────────────────────────────────────────────

export const DealerCardSkeleton: React.FC = () => (
  <div className="bg-bg-tertiary rounded-xl border border-border-subtle p-4 space-y-3">
    <div className="flex items-start justify-between gap-2">
      <div className="space-y-2 flex-1">
        <Skeleton className="h-5 w-2/3" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-3 w-1/3" />
      </div>
      <Skeleton className="h-6 w-14 rounded-full flex-shrink-0" />
    </div>
    <div className="flex gap-2 pt-1">
      <Skeleton className="h-10 flex-1 rounded-lg" />
      <Skeleton className="h-10 flex-1 rounded-lg" />
    </div>
  </div>
);

// ─── Home Dashboard Skeleton ───────────────────────────────────────────────────

export const HomeDashboardSkeleton: React.FC = () => (
  <div className="px-4 space-y-6">
    {/* Greeting */}
    <Skeleton className="h-8 w-48 mt-2" />

    {/* Crop pills row */}
    <div>
      <div className="flex items-center justify-between mb-3">
        <Skeleton className="h-5 w-24" />
        <Skeleton className="h-5 w-16" />
      </div>
      <div className="grid grid-cols-4 gap-2">
        {Array.from({ length: 4 }).map((_, i) => (
          <CropCardSkeleton key={i} />
        ))}
      </div>
    </div>

    {/* Recent scans */}
    <div>
      <div className="flex items-center justify-between mb-3">
        <Skeleton className="h-5 w-28" />
        <Skeleton className="h-5 w-14" />
      </div>
      <div className="space-y-2">
        {Array.from({ length: 3 }).map((_, i) => (
          <ScanHistoryItemSkeleton key={i} />
        ))}
      </div>
    </div>
  </div>
);
