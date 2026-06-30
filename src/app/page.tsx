'use client';

import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAppStore } from '@/stores/appStore';
import { AppLayout } from '@/components/layouts/AppLayout';

export default function SplashPage() {
  const router = useRouter();
  const { language, setLanguage } = useAppStore();

  useEffect(() => {
    const hasUsedApp = localStorage.getItem('fasalguard-app');
    if (hasUsedApp) {
      const parsed = JSON.parse(hasUsedApp) as { state?: { language?: string } };
      if (parsed.state?.language) {
        router.replace('/home');
      }
    }
  }, [router]);

  const handleLanguageSelect = (lang: 'ur' | 'en') => {
    setLanguage(lang);
  };

  const handleStart = () => {
    router.push('/home');
  };

  return (
    <AppLayout>
      <div className="screen active" id="screen-splash">
        <div className="splash-screen">
          <div className="splash-logo">🌿</div>
          <div className="splash-app-name">FasalGuard</div>
          <div className="splash-tagline">AI-powered crop disease detection<br/>for every Pakistani farmer</div>
          <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.45)', marginBottom: '20px', fontFamily: "'Noto Nastaliq Urdu',serif", direction: 'rtl' }}>اپنی زبان منتخب کریں</div>
          
          <div className="lang-cards">
            <div 
              className={`lang-card ${language === 'ur' ? 'selected' : ''}`} 
              onClick={() => handleLanguageSelect('ur')}
            >
              <div className="lang-card-left">
                <div>
                  <div className="lang-name-primary" style={{ fontFamily: "'Noto Nastaliq Urdu',serif", direction: 'rtl' }}>اردو</div>
                  <div className="lang-name-secondary">اپنی پسندیدہ زبان منتخب کریں</div>
                </div>
              </div>
              <div className={`check-circle ${language === 'ur' ? 'checked' : ''}`}>
                {language === 'ur' && <i className="ti ti-check">✓</i>}
              </div>
            </div>

            <div 
              className={`lang-card ${language === 'en' ? 'selected' : ''}`} 
              onClick={() => handleLanguageSelect('en')}
            >
              <div className="lang-card-left">
                <div>
                  <div className="lang-name-primary">English</div>
                  <div className="lang-name-secondary">Select your preferred language</div>
                </div>
              </div>
              <div className={`check-circle ${language === 'en' ? 'checked' : ''}`}>
                {language === 'en' && <i className="ti ti-check">✓</i>}
              </div>
            </div>
          </div>

          <button className="start-btn" onClick={handleStart}>
            <div>شروع کریں</div>
            <div style={{ fontSize: '13px', opacity: 0.65, marginTop: '3px' }}>Get Started</div>
          </button>
        </div>
      </div>
    </AppLayout>
  );
}
