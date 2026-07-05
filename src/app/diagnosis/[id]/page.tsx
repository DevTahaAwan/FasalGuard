'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Share2, MapPin, ArrowLeft, Volume2, Play } from 'lucide-react';
import { useAppStore } from '@/stores/appStore';
import { useScanStore } from '@/stores/scanStore';
import { AppLayout } from '@/components/layouts/AppLayout';
import { StatusBar } from '@/components/ui/StatusBar';
import { getMockAdvisory } from '@/lib/mock/advisory';

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

export default function DiagnosisPage() {
  const router = useRouter();
  const { language } = useAppStore();
  const { analyzeResult, advisoryResult, setAdvisoryResult, phase, capturedImageDataUrl } = useScanStore();
  const [loading, setLoading] = useState(true);
  const [isVisible, setIsVisible] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);

  const isRTL = language === 'ur';

  useEffect(() => {
    setIsVisible(true);
    if (typeof navigator !== 'undefined' && navigator.vibrate) {
      navigator.vibrate([100, 50, 100]);
    }

    if (advisoryResult) {
      setLoading(false);
      return;
    }

    let cancelled = false;

    async function fetchAdvisory() {
      if (!analyzeResult) return;

      try {
        const res = await fetch('/api/v1/scan/advisory', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            scan_id: analyzeResult.scan_id,
            disease_label: analyzeResult.disease_label,
            disease_slug: analyzeResult.disease_slug,
            crop_type: analyzeResult.crop_type_slug || 'unknown',
            disease_name_en: analyzeResult.disease_name_en,
            disease_name_ur: analyzeResult.disease_name_ur,
            language: language,
            severity: analyzeResult.severity,
            is_healthy: analyzeResult.is_healthy,
          }),
        });

        const json = await res.json();

        if (!cancelled && json.success && json.data) {
          setAdvisoryResult(json.data);
          setLoading(false);
          return;
        }
      } catch (err) {
        console.error('Advisory API error, falling back to mock:', err);
      }

      if (!cancelled) {
        const slug = analyzeResult?.disease_slug || 'healthy';
        const mockAdvisory = getMockAdvisory(slug);
        setAdvisoryResult(mockAdvisory);
        setLoading(false);
      }
    }

    fetchAdvisory();

    return () => {
      cancelled = true;
    };
  }, [advisoryResult, analyzeResult, setAdvisoryResult, language]);

  // Save captured image to localStorage so it persists across renders.
  // This runs inside useEffect, which only ever executes client-side — safe as-is.
  useEffect(() => {
    if (capturedImageDataUrl) {
      localStorage.setItem('last_scan_img', capturedImageDataUrl);
    }
  }, [capturedImageDataUrl]);

  // CRITICAL FIX: the previous version read localStorage directly in the
  // render body:
  //   let displayImage = capturedImageDataUrl;
  //   if (!displayImage) displayImage = localStorage.getItem('last_scan_img');
  //
  // That runs during server-side rendering in Next.js App Router, where
  // `localStorage` does not exist — throwing a ReferenceError on the SERVER
  // for every single page load. Next.js surfaces this as a 500, which is the
  // exact error seen in the browser console on this page. This explains why
  // the result never rendered even immediately after a successful scan: the
  // page was crashing server-side before any client-side state logic ran.
  //
  // Fixed by moving this into state, populated only inside useEffect (which
  // only ever runs client-side, after hydration).
  const [displayImage, setDisplayImage] = useState<string | null>(null);

  useEffect(() => {
    if (capturedImageDataUrl) {
      setDisplayImage(capturedImageDataUrl);
    } else if (typeof window !== 'undefined') {
      setDisplayImage(localStorage.getItem('last_scan_img'));
    }
  }, [capturedImageDataUrl]);

  const handleShare = () => {
    const cropEn = analyzeResult?.crop_name_en || 'Unknown';
    const cropUr = analyzeResult?.crop_name_ur || 'نامعلوم';

    const isHealthy = analyzeResult?.is_healthy || advisoryResult?.advisory_type === 'healthy_confirmation';
    const diseaseEn = isHealthy ? 'Healthy' : analyzeResult?.disease_name_en || 'Unknown';
    const diseaseUr = isHealthy ? 'صحت مند' : analyzeResult?.disease_name_ur || 'نامعلوم';

    const capitalize = (s: string) => (s ? s.charAt(0).toUpperCase() + s.slice(1).toLowerCase() : 'Unknown');
    const severity = capitalize(analyzeResult?.severity || 'Unknown');
    const confidence = capitalize(analyzeResult?.confidence_level || 'Unknown');
    const summary = advisoryResult?.disease_summary || '';

    let shareText =
      `🌿 *FasalGuard AI Diagnosis*\n\n` +
      `Crop: ${cropEn} (${cropUr})\n` +
      `Condition: ${diseaseEn} (${diseaseUr})\n` +
      `Severity: ${severity}\n` +
      `Confidence: ${confidence}\n\n` +
      `${summary}\n\n` +
      `📱 Diagnosed by FasalGuard — AI Crop Health Scanner\n` +
      `🔗 fasalguard.vercel.app`;

    if (encodeURIComponent(shareText).length > 1800) {
      shareText =
        `🌿 *FasalGuard AI Diagnosis*\n\n` +
        `Crop: ${cropEn} (${cropUr})\n` +
        `Condition: ${diseaseEn} (${diseaseUr})\n` +
        `Severity: ${severity}\n` +
        `Confidence: ${confidence}\n\n` +
        `📱 Diagnosed by FasalGuard — AI Crop Health Scanner\n` +
        `🔗 fasalguard.vercel.app`;
    }

    if (navigator.share) {
      navigator.share({ title: 'FasalGuard Diagnosis', text: shareText });
    } else {
      window.open('https://api.whatsapp.com/send?text=' + encodeURIComponent(shareText));
    }
  };

  if (loading || phase !== 'complete' || !advisoryResult || !analyzeResult) {
    return (
      <AppLayout>
        <div className="screen active">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', flexDirection: 'column' }}>
            <p>Loading result...</p>
          </div>
        </div>
      </AppLayout>
    );
  }

  const isHealthy = analyzeResult.is_healthy || advisoryResult.advisory_type === 'healthy_confirmation';

  const diagnosis = analyzeResult;
  let borderColor = 'border-green-500';
  if (diagnosis.severity === 'high' || diagnosis.severity === 'urgent') {
    borderColor = 'border-red-500';
  } else if (diagnosis.severity === 'moderate') {
    borderColor = 'border-yellow-500';
  }

  let displaySummary = advisoryResult.disease_summary || '';
  if (!isExpanded && displaySummary.length > 100) {
    displaySummary = displaySummary.substring(0, 100) + '...';
  }

  return (
    <AppLayout>
      <div className={`screen active transition-opacity duration-500 ease-in-out ${isVisible ? 'opacity-100' : 'opacity-0'}`} id="screen-result">
        <StatusBar />

        <div className="result-header">
          <div className="header-row">
            <div className="back-btn min-h-[48px] min-w-[48px] flex items-center justify-center p-3" onClick={() => router.push('/home')}>
              <ArrowLeft color="#fff" size={20} />
            </div>
            <div className="screen-tag">{isRTL ? 'نتیجہ' : 'Result'}</div>
            <div style={{ width: '36px' }}></div>
          </div>

          <div className="result-crop-tag">
            <span style={{ fontSize: '16px', marginRight: '4px' }}>{CROP_ICONS[analyzeResult.crop_type_slug || ''] || '🌱'}</span>
            {isRTL ? (
              <span className="text-xl font-bold leading-relaxed">{analyzeResult.crop_name_ur}</span>
            ) : (
              <span className="text-base font-normal">{analyzeResult.crop_name_en}</span>
            )}
          </div>

          <div className="result-disease">
            {isRTL ? (
              <span className="text-xl font-bold leading-relaxed">{isHealthy ? 'فصل صحت مند ہے' : analyzeResult.disease_name_ur}</span>
            ) : (
              <span className="text-base font-normal">{isHealthy ? 'Crop is Healthy' : analyzeResult.disease_name_en}</span>
            )}
          </div>

          {!isHealthy && (
            <div className="severity-bar">
              <div className="sev-label">Severity</div>
              <div className="sev-pills">
                <div className={`sev-pill filled ${analyzeResult.severity === 'high' ? 'high' : ''}`}></div>
                <div className={`sev-pill filled ${analyzeResult.severity === 'high' ? 'high' : ''}`}></div>
                <div className={`sev-pill ${analyzeResult.severity === 'high' ? 'filled high' : ''}`}></div>
              </div>
              <span style={{ fontSize: '12px', color: analyzeResult.severity === 'high' ? '#fca5a5' : '#fcd34d', fontWeight: 600 }}>
                {isRTL ? (
                  <span className="text-xl font-bold leading-relaxed">{analyzeResult.severity === 'high' ? 'شدید' : 'درمیانہ'}</span>
                ) : (
                  <span className="text-base font-normal">{analyzeResult.severity === 'high' ? 'Severe' : 'Moderate'}</span>
                )}
              </span>
            </div>
          )}
        </div>

        <div className={`result-content border-4 rounded-xl p-4 bg-white shadow-lg ${borderColor}`}>
          <div style={{ height: '14px' }}></div>

          <button className="audio-btn min-h-[48px] min-w-[48px] flex items-center justify-center p-3">
            <div className="audio-icon">
              <Volume2 color="#fff" size={20} />
            </div>
            <div className="audio-text">
              <div className="audio-text-title">
                {isRTL ? (
                  <span className="text-xl font-bold leading-relaxed">آواز میں سنیں</span>
                ) : (
                  <span className="text-base font-normal">Play Audio</span>
                )}
              </div>
              <div className="audio-text-sub">Tap to hear full diagnosis in Urdu</div>
            </div>
            <Play size={18} color="var(--green-primary)" />
          </button>

          <div className="info-card">
            {displayImage && (
              <img
                src={displayImage}
                alt="Scanned crop"
                style={{ width: '100%', borderRadius: '12px', marginBottom: '12px', objectFit: 'cover', maxHeight: '200px' }}
              />
            )}
            <div className="info-card-title">
              {isRTL ? (
                <span className="text-xl font-bold leading-relaxed">بیماری کی معلومات</span>
              ) : (
                <span className="text-base font-normal">Disease Info</span>
              )}
            </div>
            <div className="info-card-body">
              <p className="text-gray-700 mt-2">{displaySummary}</p>
              {advisoryResult.disease_summary && advisoryResult.disease_summary.length > 100 && (
                <button
                  onClick={() => setIsExpanded(!isExpanded)}
                  className="mt-2 text-green-700 font-bold underline min-h-[48px] p-2"
                >
                  {isExpanded ? (isRTL ? 'کم دکھائیں' : 'Read Less') : (isRTL ? 'مزید پڑھیں' : 'Read More')}
                </button>
              )}
              <br />
              <br />
              <span style={{ fontFamily: "'Noto Nastaliq Urdu',serif", fontSize: '14px', direction: 'rtl', display: 'block', marginTop: '8px' }}>
                {advisoryResult.severity_explanation}
              </span>
            </div>
          </div>

          {!isHealthy && advisoryResult.products && advisoryResult.products.length > 0 && (
            <div className="info-card">
              <div className="info-card-title">
                {isRTL ? (
                  <span className="text-xl font-bold leading-relaxed">علاج</span>
                ) : (
                  <span className="text-base font-normal">Treatment</span>
                )}
              </div>
              {advisoryResult.products.map((product, index) => (
                <div key={index} className="treatment-item">
                  <div className="treat-num">{index + 1}</div>
                  <div>
                    <div className="treat-name">{product.name}</div>
                    <div className="treat-dose">{product.dosage}</div>
                  </div>
                </div>
              ))}

              {advisoryResult.safety_note && (
                <div className="treatment-item">
                  <div className="treat-num" style={{ background: '#fef2f2', color: '#dc2626' }}>!</div>
                  <div>
                    <div className="treat-name">
                      {isRTL ? (
                        <span className="text-xl font-bold leading-relaxed">احتیاط</span>
                      ) : (
                        <span className="text-base font-normal">Safety Note</span>
                      )}
                    </div>
                    <div className="treat-dose">{advisoryResult.safety_note}</div>
                  </div>
                </div>
              )}
            </div>
          )}

          <div className="action-row">
            <div className="action-btn" onClick={() => router.push('/dealers')}>
              <div className="action-btn-icon" style={{ background: 'var(--green-light)' }}>
                <MapPin color="var(--green-primary)" size={18} />
              </div>
              <div className="action-btn-label">Find Dealer</div>
              <div className="action-btn-sub">قریبی دکان</div>
            </div>
            <div className="action-btn" onClick={handleShare}>
              <div className="action-btn-icon" style={{ background: '#eff6ff' }}>
                <Share2 color="#2563eb" size={18} />
              </div>
              <div className="action-btn-label">Share Result</div>
              <div className="action-btn-sub">WhatsApp پر شیئر</div>
            </div>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}