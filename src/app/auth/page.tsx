'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Smartphone, CheckCircle } from 'lucide-react';
import { useAppStore } from '@/stores/appStore';
import { useAuthStore } from '@/stores/authStore';
import { AppLayout } from '@/components/layouts/AppLayout';
import { Button } from '@/components/ui/Button';

// ─── Auth Page ────────────────────────────────────────────────────────────────

export default function AuthPage() {
  const router = useRouter();
  const { language } = useAppStore();
  const { setUser, setSession, setAnonymous } = useAuthStore();
  
  const [step, setStep] = useState<'phone' | 'otp'>('phone');
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const isRTL = language === 'ur';

  const t = {
    title: isRTL ? 'اکاؤنٹ بنائیں' : 'Create Account',
    subtitle: isRTL 
      ? 'تمام آلات پر اپنی اسکین کی تاریخ محفوظ کریں' 
      : 'Save your scan history across all devices',
    phoneLabel: isRTL ? 'موبائل نمبر' : 'Mobile Number',
    sendOtp: isRTL ? 'او ٹی پی بھیجیں' : 'Send OTP',
    otpLabel: isRTL ? 'او ٹی پی درج کریں' : 'Enter OTP',
    otpSubtitle: isRTL 
      ? `${phone} پر بھیجا گیا ۶ ہندسوں کا کوڈ درج کریں`
      : `Enter the 6-digit code sent to ${phone}`,
    verifyOtp: isRTL ? 'تصدیق کریں' : 'Verify',
    skip: isRTL ? 'ابھی چھوڑیں' : 'Skip for now',
    invalidPhone: isRTL ? 'درست نمبر درج کریں' : 'Enter a valid number',
    invalidOtp: isRTL ? 'درست کوڈ درج کریں' : 'Enter a valid code',
  };

  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (phone.length < 10) {
      setError(t.invalidPhone);
      return;
    }
    
    setError('');
    setIsLoading(true);
    
    // Mock API delay
    await new Promise((r) => setTimeout(r, 1200));
    
    setIsLoading(false);
    setStep('otp');
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (otp.length < 6) {
      setError(t.invalidOtp);
      return;
    }

    setError('');
    setIsLoading(true);
    
    // Mock API delay
    await new Promise((r) => setTimeout(r, 1200));
    
    setIsLoading(false);
    
    // Set user as authenticated
    setUser({ id: 'user-mock-123', phone, isAnonymous: false });
    setSession({ accessToken: 'mock-token', refreshToken: 'mock-refresh' });
    
    router.replace('/home');
  };

  const handleSkip = () => {
    setAnonymous('anon-mock-456');
    router.replace('/home');
  };

  return (
    <AppLayout>
      <div className="flex flex-col min-h-screen px-6 py-12">
        {/* Header Icon */}
        <div className="flex flex-col items-center mb-10 mt-8">
          <div className="h-16 w-16 bg-brand-subtle rounded-full flex items-center justify-center mb-6">
            {step === 'phone' ? (
              <Smartphone className="h-8 w-8 text-brand-primary" />
            ) : (
              <CheckCircle className="h-8 w-8 text-brand-primary" />
            )}
          </div>
          <h1 className={[
            'text-2xl font-bold text-text-primary mb-2 text-center',
            isRTL ? 'font-serif' : 'font-sans'
          ].join(' ')}>
            {t.title}
          </h1>
          <p className={[
            'text-sm text-text-secondary text-center max-w-xs',
            isRTL ? 'font-serif' : 'font-sans'
          ].join(' ')}>
            {step === 'phone' ? t.subtitle : t.otpSubtitle}
          </p>
        </div>

        {/* Forms */}
        <div className="flex-1 w-full max-w-sm mx-auto">
          {step === 'phone' ? (
            <form onSubmit={handleSendOtp} className="space-y-6">
              <div className="space-y-2">
                <label className={[
                  'block text-sm font-medium text-text-primary',
                  isRTL ? 'font-serif' : 'font-sans'
                ].join(' ')} dir={isRTL ? 'rtl' : 'ltr'}>
                  {t.phoneLabel}
                </label>
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value.replace(/\D/g, ''))}
                  placeholder="03XX-XXXXXXX"
                  className="w-full h-14 bg-bg-tertiary border border-border-default rounded-xl px-4 outline-none focus:border-brand-primary focus:ring-1 focus:ring-brand-primary text-lg text-center tracking-wider font-sans transition-colors"
                  dir="ltr"
                />
                {error && <p className="text-error text-sm text-center mt-1">{error}</p>}
              </div>

              <Button
                type="submit"
                variant="primary"
                size="lg"
                fullWidth
                isLoading={isLoading}
              >
                {t.sendOtp}
              </Button>
            </form>
          ) : (
            <form onSubmit={handleVerifyOtp} className="space-y-6">
              <div className="space-y-2">
                <label className={[
                  'block text-sm font-medium text-text-primary',
                  isRTL ? 'font-serif' : 'font-sans'
                ].join(' ')} dir={isRTL ? 'rtl' : 'ltr'}>
                  {t.otpLabel}
                </label>
                <input
                  type="text"
                  maxLength={6}
                  value={otp}
                  onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                  placeholder="000000"
                  className="w-full h-14 bg-bg-tertiary border border-border-default rounded-xl px-4 outline-none focus:border-brand-primary focus:ring-1 focus:ring-brand-primary text-2xl text-center tracking-widest font-sans transition-colors"
                  dir="ltr"
                />
                {error && <p className="text-error text-sm text-center mt-1">{error}</p>}
              </div>

              <Button
                type="submit"
                variant="primary"
                size="lg"
                fullWidth
                isLoading={isLoading}
              >
                {t.verifyOtp}
              </Button>
            </form>
          )}

          {/* Skip Button */}
          {step === 'phone' && (
            <div className="mt-8 text-center">
              <Button
                variant="ghost"
                onClick={handleSkip}
                className="text-text-tertiary hover:text-text-secondary"
              >
                {t.skip}
              </Button>
            </div>
          )}
        </div>
      </div>
    </AppLayout>
  );
}
