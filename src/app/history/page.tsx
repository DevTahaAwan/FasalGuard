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
          <div className="back-btn min-h-[48px] min-w-[48px] flex items-center justify-center p-3" onClick={() => router.back()}>
            <ArrowLeft color="#fff" size={20} />
          </div>
          <div className="screen-title">
            {isRTL ? (
              <span className="text-xl font-bold leading-relaxed">اسکین کی تاریخ</span>
            ) : (
              <span className="text-base font-normal">Scan History</span>
            )}
          </div>
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
                      <div className="hist-crop">
                        {isRTL ? (
                          <span className="text-xl font-bold leading-relaxed">{scan.crop_name_ur}</span>
                        ) : (
                          <span className="text-base font-normal">{scan.crop_name_en}</span>
                        )}
                      </div>
                      <div className="hist-disease">
                        {isRTL ? (
                          <span className="text-xl font-bold leading-relaxed">{scan.is_healthy ? 'صحت مند' : (scan.disease_name_ur || scan.disease_name_en)}</span>
                        ) : (
                          <span className="text-base font-normal">{scan.is_healthy ? 'Healthy' : scan.disease_name_en}</span>
                        )}
                      </div>
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
              <div className="flex flex-col items-center justify-center p-12 text-gray-500 text-center mt-10">
                <svg className="w-24 h-24 text-gray-300 mb-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
                <h3 className="text-xl font-bold text-gray-700 mb-2">
                  {isRTL ? 'کوئی ریکارڈ نہیں ملا' : 'No records found'}
                </h3>
                <p className="text-base">
                  {isRTL ? 'اپنا پہلا سکین شروع کریں!' : 'Let\'s start your first scan!'}
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
