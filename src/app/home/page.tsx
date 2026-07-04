'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { AppLayout } from '@/components/layouts/AppLayout';
import { BottomNavigation } from '@/components/layouts/BottomNavigation';
import { useAppStore } from '@/stores/appStore';
import { MOCK_CROPS } from '@/lib/mock/crops';
import { MOCK_SCAN_HISTORY } from '@/lib/mock/scans';
import type { CropType, ScanHistoryItem } from '@/types/api';
import { Camera, AlertCircle, AlertTriangle, CheckCircle } from 'lucide-react';
import { StatusBar } from '@/components/ui/StatusBar';

async function fetchCrops(): Promise<CropType[]> {
  await new Promise((r) => setTimeout(r, 600));
  return MOCK_CROPS;
}

async function fetchRecentScans(): Promise<ScanHistoryItem[]> {
  await new Promise((r) => setTimeout(r, 800));
  return MOCK_SCAN_HISTORY.slice(0, 3);
}

const CROP_ICONS: Record<string, string> = {
  wheat: '🌾',
  cotton: '🌿',
  rice: '🍚',
  tomato: '🍅',
  potato: '🥔',
  sugarcane: '🎋',
  maize: '🌽',
  onion: '🧅',
  chilli: '🌶️',
  mango: '🥭',
};

export default function HomePage() {
  const router = useRouter();
  const language = useAppStore((s) => s.language);
  const { selectedCropSlugs, addCropSlug, removeCropSlug, theme, setTheme } = useAppStore();
  const [isModalOpen, setIsModalOpen] = useState(false);

  const cropsQuery = useQuery({ queryKey: ['crops'], queryFn: fetchCrops });
  const scansQuery = useQuery({ queryKey: ['history', 'recent'], queryFn: fetchRecentScans });

  const isRTL = language === 'ur';

  const t = {
    greeting: isRTL ? 'خوش آمدید، کسان' : 'Good day, Farmer',
    scanHero: isRTL ? 'فصل اسکین کریں' : 'Scan Your Crop',
    scanHeroSub: isRTL ? 'فوری تشخیص کے لیے پودے کی تصویر لیں' : 'Point camera at leaves for instant AI diagnosis',
    scanCta: isRTL ? 'کیمرہ کھولیں' : 'Tap to Open Camera',
    yourCrops: isRTL ? 'آپ کی فصلیں · Your Crops' : 'Your Crops · آپ کی فصلیں',
    addCrop: isRTL ? '+ فصل شامل کریں' : '+ Add Crop',
    recentScans: isRTL ? 'حالیہ اسکین · Recent Scans' : 'Recent Scans · حالیہ اسکین',
    seeAll: isRTL ? 'سب دیکھیں' : 'See All',
  };

  const toggleTheme = () => {
    if (theme === 'light') setTheme('dark');
    else if (theme === 'dark') setTheme('sunlight');
    else setTheme('light');
  };

  const themeIcon = theme === 'light' ? '☀️' : theme === 'dark' ? '🌙' : '🌞';

  return (
    <AppLayout>
      <div className="screen active" id="screen-home">
        <StatusBar />
        
        <div className="header">
          <div className="header-row">
            <div className="logo-row">
              <div className="logo-icon">🌿</div>
              <span className="logo-text">FasalGuard</span>
            </div>
            <div style={{ display: 'flex', gap: '8px' }}>
              <button className="lang-toggle" onClick={toggleTheme}>
                {themeIcon}
              </button>
              <button className="lang-toggle" onClick={() => useAppStore.getState().setLanguage(isRTL ? 'en' : 'ur')}>
                {isRTL ? 'English' : 'اردو'}
              </button>
            </div>
          </div>
          <div className="greeting">{t.greeting}</div>
          <div className="greeting-sub">FasalGuard · Today</div>
        </div>

        <div className="scroll-content">
          <div style={{ height: '14px' }}></div>

          <div className="scan-hero mt-8" onClick={() => router.push('/scanner')}>
            <div className="scan-icon-wrap">
              <Camera size={26} color="#fff" aria-hidden="true" />
            </div>
            <div className="scan-label">{t.scanHero}</div>
            <div className="scan-sub">{t.scanHeroSub}</div>
            <div className="scan-cta">
              <Camera size={13} aria-hidden="true" />
              {t.scanCta}
            </div>
          </div>

          <div className="section-row">
            <div className="section-title">{t.yourCrops}</div>
            <div className="section-action" onClick={() => setIsModalOpen(true)}>{t.addCrop}</div>
          </div>

          <div className="crops-grid">
            {cropsQuery.isLoading ? (
              <p>Loading...</p>
            ) : cropsQuery.data ? (
              cropsQuery.data.filter(c => selectedCropSlugs.includes(c.slug) || selectedCropSlugs.length === 0).map(crop => (
                <div 
                  key={crop.id}
                  className={`crop-card ${selectedCropSlugs.includes(crop.slug) ? 'selected' : ''}`}
                  onClick={() => setIsModalOpen(true)}
                >
                  <div className="crop-emoji">{CROP_ICONS[crop.slug] || '🌱'}</div>
                  <div className="crop-name">{crop.name_en}<br/>{crop.name_ur}</div>
                </div>
              ))
            ) : null}
          </div>

          <div className="section-row">
            <div className="section-title">{t.recentScans}</div>
            <div className="section-action" onClick={() => router.push('/history')}>{t.seeAll}</div>
          </div>

          <div className="scan-history-section">
            {scansQuery.isLoading ? (
              <p>Loading...</p>
            ) : scansQuery.data ? (
              scansQuery.data.map(scan => (
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
                  <div className="hist-date">Recent</div>
                </div>
              ))
            ) : null}
          </div>
        </div>

        <BottomNavigation />

        <div className={`add-crop-modal ${isModalOpen ? 'open' : ''}`} onClick={(e) => { if (e.target === e.currentTarget) setIsModalOpen(false) }}>
          <div className="modal-sheet">
            <div className="modal-handle"></div>
            <div className="modal-title">فصل شامل کریں · Add Crop</div>
            <div className="crop-select-grid">
              {cropsQuery.data?.map(crop => (
                <div 
                  key={crop.id}
                  className={`crop-select-item ${selectedCropSlugs.includes(crop.slug) ? 'selected' : ''}`}
                  onClick={() => selectedCropSlugs.includes(crop.slug) ? removeCropSlug(crop.slug) : addCropSlug(crop.slug)}
                >
                  <div className="crop-select-emoji">{CROP_ICONS[crop.slug] || '🌱'}</div>
                  <div className="crop-select-name">{crop.name_en}<br/>{crop.name_ur}</div>
                </div>
              ))}
            </div>
            <button className="save-crop-btn" onClick={() => setIsModalOpen(false)}>محفوظ کریں · Save Crops</button>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
