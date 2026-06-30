'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, AlertCircle, AlertTriangle, CheckCircle } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { useAppStore } from '@/stores/appStore';
import { AppLayout } from '@/components/layouts/AppLayout';
import { MOCK_SCAN_HISTORY } from '@/lib/mock/scans';
import type { ScanHistoryItem } from '@/types/api';
import { StatusBar } from '@/components/ui/StatusBar';

async function fetchHistory(): Promise<ScanHistoryItem[]> {
  await new Promise((r) => setTimeout(r, 800));
  return MOCK_SCAN_HISTORY;
}

const CROP_ICONS: Record<string, string> = {
  wheat: '🌾', cotton: '🌿', rice: '🍚', tomato: '🍅', potato: '🥔',
  sugarcane: '🎋', maize: '🌽', onion: '🧅', chilli: '🌶️', mango: '🥭',
};

export default function HistoryPage() {
  const router = useRouter();
  const { language } = useAppStore();
  const isRTL = language === 'ur';

  const { data, isLoading } = useQuery({
    queryKey: ['history', 'all'],
    queryFn: fetchHistory,
  });

  return (
    <AppLayout>
      <div className="screen active" id="screen-history">
        <StatusBar />
        
        <div className="simple-header">
          <div className="back-btn" onClick={() => router.back()}>
            <ArrowLeft color="#fff" size={20} />
          </div>
          <div className="screen-title">{isRTL ? 'اسکین کی تاریخ' : 'Scan History'}</div>
        </div>

        <div className="scroll-content" style={{ paddingTop: '20px' }}>
          <div className="scan-history-section">
            {isLoading ? (
              <p>Loading...</p>
            ) : data && data.length > 0 ? (
              data.map((scan) => {
                const dateOpts: Intl.DateTimeFormatOptions = { 
                  day: 'numeric', month: 'short', year: 'numeric', 
                  hour: 'numeric', minute: '2-digit' 
                };
                const date = new Date(scan.scanned_at).toLocaleDateString(
                  language === 'ur' ? 'ur-PK' : 'en-PK',
                  dateOpts
                );

                return (
                  <div key={scan.scan_id} className="history-card" onClick={() => router.push(`/diagnosis/${scan.scan_id}`)}>
                    <div className="hist-icon" style={{ background: scan.is_healthy ? '#d4edda' : scan.severity === 'high' ? '#fef2f2' : '#fffbeb' }}>
                      <span style={{ fontSize: '22px' }}>{CROP_ICONS[scan.crop_type_slug] || '🌱'}</span>
                    </div>
                    <div className="hist-info">
                      <div className="hist-crop">{scan.crop_name_en} · {scan.crop_name_ur}</div>
                      <div className="hist-disease">{scan.is_healthy ? (isRTL ? 'صحت مند' : 'Healthy') : scan.disease_name_en}</div>
                      {scan.is_healthy ? (
                        <div className="badge badge-green">
                          <CheckCircle size={10} aria-hidden="true" /> Healthy
                        </div>
                      ) : (
                        <div className={`badge ${scan.severity === 'high' ? 'badge-red' : 'badge-amber'}`}>
                          {scan.severity === 'high' ? <AlertCircle size={10} /> : <AlertTriangle size={10} />}
                          {scan.severity === 'high' ? ' Severe' : ' Moderate'}
                        </div>
                      )}
                    </div>
                    <div className="hist-date">{date}</div>
                  </div>
                );
              })
            ) : (
              <p>{isRTL ? 'کوئی اسکین نہیں ملا' : 'No history found'}</p>
            )}
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
