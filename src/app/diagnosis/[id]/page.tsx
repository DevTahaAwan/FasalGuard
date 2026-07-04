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

  const isRTL = language === 'ur';

  useEffect(() => {
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

      // Fallback to mock advisory if API fails
      if (!cancelled) {
        const slug = analyzeResult?.disease_slug || 'healthy';
        const mockAdvisory = getMockAdvisory(slug);
        setAdvisoryResult(mockAdvisory);
        setLoading(false);
      }
    }

    fetchAdvisory();

    return () => { cancelled = true; };
  }, [advisoryResult, analyzeResult, setAdvisoryResult, language]);

  // Save captured image to localStorage so it persists across renders
  useEffect(() => {
    if (capturedImageDataUrl) {
      localStorage.setItem('last_scan_img', capturedImageDataUrl);
    }
  }, [capturedImageDataUrl]);

  // Read image from localStorage as fallback if Zustand state was cleared
  let displayImage = capturedImageDataUrl;
  if (!displayImage) {
    displayImage = localStorage.getItem('last_scan_img');
  }

  const handleShare = () => {
    const cropEn = analyzeResult?.crop_name_en || 'Unknown';
    const cropUr = analyzeResult?.crop_name_ur || 'نامعلوم';
    
    const isHealthy = analyzeResult?.is_healthy || advisoryResult?.advisory_type === 'healthy_confirmation';
    const diseaseEn = isHealthy ? 'Healthy' : (analyzeResult?.disease_name_en || 'Unknown');
    const diseaseUr = isHealthy ? 'صحت مند' : (analyzeResult?.disease_name_ur || 'نامعلوم');
    
    const capitalize = (s: string) => s ? s.charAt(0).toUpperCase() + s.slice(1).toLowerCase() : 'Unknown';
    const severity = capitalize(analyzeResult?.severity || 'Unknown');
    const confidence = capitalize(analyzeResult?.confidence_level || 'Unknown');
    const summary = advisoryResult?.disease_summary || '';

    let shareText = `🌿 *FasalGuard AI Diagnosis*\n\n` +
      `Crop: ${cropEn} (${cropUr})\n` +
      `Condition: ${diseaseEn} (${diseaseUr})\n` +
      `Severity: ${severity}\n` +
      `Confidence: ${confidence}\n\n` +
      `${summary}\n\n` +
      `📱 Diagnosed by FasalGuard — AI Crop Health Scanner\n` +
      `🔗 fasalguard.vercel.app`;

    // WhatsApp GET URL length limit is ~2000 chars. 
    // encodeURIComponent inflates Urdu characters significantly (up to 9 chars per char).
    // If it's too long, prioritize core diagnosis and branding over the summary.
    if (encodeURIComponent(shareText).length > 1800) {
      shareText = `🌿 *FasalGuard AI Diagnosis*\n\n` +
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

  return (
    <AppLayout>
      <div className="screen active" id="screen-result">
        <StatusBar />

        <div className="result-header">
          <div className="header-row">
            <div className="back-btn" onClick={() => router.push('/home')}>
              <ArrowLeft color="#fff" size={20} />
            </div>
            <div className="screen-tag">{isRTL ? 'نتیجہ' : 'Result'}</div>
            <div style={{ width: '36px' }}></div>
          </div>
          
          <div className="result-crop-tag">
            <span style={{ fontSize: '16px', marginRight: '4px' }}>{CROP_ICONS[analyzeResult.crop_type_slug || ''] || '🌱'}</span>
            {analyzeResult.crop_name_en} · {analyzeResult.crop_name_ur}
          </div>
          
          <div className="result-disease">
            {isHealthy ? (isRTL ? 'فصل صحت مند ہے' : 'Crop is Healthy') : analyzeResult.disease_name_en}
            {!isHealthy && <br/>}
            {!isHealthy && <span style={{ fontFamily: "'Noto Nastaliq Urdu',serif", fontSize: '20px', fontWeight: 500 }}>{analyzeResult.disease_name_ur}</span>}
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
                {analyzeResult.severity === 'high' ? 'Severe · شدید' : 'Moderate · درمیانہ'}
              </span>
            </div>
          )}
        </div>

        <div className="result-content">
          <div style={{ height: '14px' }}></div>

          <button className="audio-btn">
            <div className="audio-icon">
              <Volume2 color="#fff" size={20} />
            </div>
            <div className="audio-text">
              <div className="audio-text-title">{isRTL ? 'آواز میں سنیں · Play Audio' : 'Play Audio · آواز میں سنیں'}</div>
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
            <div className="info-card-title">{isRTL ? 'بیماری کی معلومات · Disease Info' : 'Disease Info · بیماری کی معلومات'}</div>
            <div className="info-card-body">
              {advisoryResult.disease_summary}
              <br/><br/>
              <span style={{ fontFamily: "'Noto Nastaliq Urdu',serif", fontSize: '14px', direction: 'rtl', display: 'block', marginTop: '8px' }}>
                {advisoryResult.severity_explanation}
              </span>
            </div>
          </div>

          {!isHealthy && advisoryResult.products && advisoryResult.products.length > 0 && (
            <div className="info-card">
              <div className="info-card-title">{isRTL ? 'علاج · Treatment' : 'Treatment · علاج'}</div>
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
                    <div className="treat-name">Safety Note · احتیاط</div>
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
