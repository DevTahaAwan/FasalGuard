'use client';

import React, { useRef, useState, useCallback, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Zap, Image as ImageIcon } from 'lucide-react';
import { useAppStore } from '@/stores/appStore';
import { useScanStore } from '@/stores/scanStore';
import { AppLayout } from '@/components/layouts/AppLayout';
import { StatusBar } from '@/components/ui/StatusBar';
import { MathLoader } from '@/components/ui/MathLoader';

export default function ScannerPage() {
  const router = useRouter();
  const { language } = useAppStore();
  const {
    phase,
    startCapture,
    setCapturedImage,
    setValidating,
    setAnalyzing,
    setAnalyzeResult,
    setError,
    errorCode,
    errorMessage,
    reset,
  } = useScanStore();

  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [cameraActive, setCameraActive] = useState(false);
  const [flashSupported, setFlashSupported] = useState(false);
  const [flashOn, setFlashOn] = useState(false);

  const isRTL = language === 'ur';

  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    setCameraActive(false);
  }, []);

  const startCamera = useCallback(async () => {
    // Guard: don't start if already active
    if (streamRef.current) return;
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment', width: { ideal: 1080 } },
        audio: false,
      });

      streamRef.current = mediaStream;
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
        videoRef.current.play();
      }
      setCameraActive(true);
      startCapture(language);

      const track = mediaStream.getVideoTracks()[0];
      if (track && track.getCapabilities) {
        const capabilities = track.getCapabilities();
        if ((capabilities as any).torch) {
          setFlashSupported(true);
        }
      }
    } catch (err: any) {
      console.error('Camera error:', err);
      if (err.name === 'NotAllowedError') {
        setError('CAMERA_DENIED', 'Please allow camera access.');
      } else {
        setError('UNKNOWN', 'Could not start camera');
      }
    }
  }, [language, startCapture, setError]);

  // Start camera only once on mount; stop on unmount
  useEffect(() => {
    startCamera();
    return () => stopCamera();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const toggleFlash = async () => {
    if (!streamRef.current || !flashSupported) return;
    const track = streamRef.current.getVideoTracks()[0];
    if (!track) return;
    try {
      await track.applyConstraints({
        advanced: [{ torch: !flashOn } as any],
      });
      setFlashOn(!flashOn);
    } catch (err) {
      console.error('Flash error:', err);
    }
  };

  const handleCapture = async () => {
    if (!videoRef.current || !canvasRef.current || !cameraActive) return;

    setValidating();
    const video = videoRef.current;
    const canvas = canvasRef.current;

    // Step 1: Draw full-resolution frame to the existing canvas
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    // Step 2: Resize to 224x224 on an offscreen canvas for MobileNetV2
    const resizeCanvas = document.createElement('canvas');
    resizeCanvas.width = 224;
    resizeCanvas.height = 224;
    const resizeCtx = resizeCanvas.getContext('2d');
    if (!resizeCtx) return;
    resizeCtx.drawImage(canvas, 0, 0, 224, 224);

    // Step 3: Convert the small canvas to a compact JPEG base64 string
    const smallDataUrl = resizeCanvas.toDataURL('image/jpeg', 0.8);

    setCapturedImage(smallDataUrl);
    stopCamera();
    setAnalyzing();

    // Client-side retry logic — the server returns immediately, client waits and retries
    try {
      const MAX_RETRIES = 5;
      let lastError = '';
      let succeeded = false;

      for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
        let res: Response | null = null;

        // Try to call our API route
        try {
          res = await fetch('/api/v1/scan/analyze', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ image: smallDataUrl, language }),
          });
        } catch (fetchErr: any) {
          lastError = fetchErr.message || 'Network error';
          if (attempt < MAX_RETRIES - 1) {
            await new Promise((resolve) => setTimeout(resolve, 3000));
            continue;
          }
          break;
        }

        // If model is loading (503), wait using estimated_time from the response
        if (res.status === 503) {
          let waitMs = 15000; // default 15s wait
          try {
            const errJson = await res.json();
            lastError = errJson?.message || 'AI model is loading...';
            if (errJson.estimated_time) {
              // Wait the estimated time + 3 seconds buffer
              waitMs = (errJson.estimated_time + 3) * 1000;
            }
          } catch {
            lastError = 'AI model is loading...';
          }
          if (attempt < MAX_RETRIES - 1) {
            await new Promise((resolve) => setTimeout(resolve, waitMs));
            continue;
          }
          break;
        }

        // If response is not OK, read the error and stop immediately
        if (!res.ok) {
          try {
            const errJson = await res.json();
            lastError = errJson?.message || errJson?.error || 'Classification failed';
          } catch {
            lastError = 'Classification failed';
          }
          break;
        }

        // Response is OK — try to parse
        let json: any = null;
        try {
          json = await res.json();
        } catch {
          lastError = 'Invalid response from server';
          break;
        }

        if (!json.success) {
          lastError = json?.message || json?.error?.message || 'Classification failed';
          break;
        }

        // Success!
        setAnalyzeResult(json.data);
        router.push(`/diagnosis/${json.data.scan_id}`);
        succeeded = true;
        break;
      }

      // If loop ended without success, show friendly error
      if (!succeeded) {
        setError('NETWORK_ERROR', lastError || 'Network timeout. Please try scanning again.');
      }
    } catch (outerErr: any) {
      // Catch-all: always stop the loader
      console.error('handleCapture error:', outerErr);
      setError('UNKNOWN', outerErr.message || 'Network timeout. Please try scanning again.');
    }
  };

  const handleClose = () => {
    stopCamera();
    reset();
    router.back();
  };

  const handleRetry = () => {
    reset();
    startCamera();
  };

  if (phase === 'error') {
    // Build a friendly error message based on the error
    let friendlyTitle = isRTL ? 'خرابی' : 'Something went wrong';
    let friendlyMessage = errorMessage || '';
    let showRetry = true;

    if (errorCode === 'NETWORK_ERROR' || (errorMessage && errorMessage.toLowerCase().includes('fetch'))) {
      friendlyTitle = isRTL ? 'AI جاگ رہا ہے' : 'The AI is waking up';
      friendlyMessage = isRTL
        ? 'براہ کرم دوبارہ اسکین کریں۔'
        : 'The AI model was asleep. Please scan again.';
    } else if (errorMessage && errorMessage.toLowerCase().includes('timeout')) {
      friendlyTitle = isRTL ? 'وقت ختم' : 'Request timed out';
      friendlyMessage = isRTL
        ? 'AI ماڈل ابھی مصروف ہے۔ دوبارہ کوشش کریں۔'
        : 'The AI is taking too long. Please try again.';
    }

    return (
      <AppLayout>
        <div className="screen active" style={{ backgroundColor: '#0d1a0f', color: '#fff', justifyContent: 'center', alignItems: 'center', padding: '32px', textAlign: 'center' }}>
          <div style={{ fontSize: '48px', marginBottom: '16px' }}>🌿</div>
          <h2 style={{ fontSize: '20px', fontWeight: 700, marginBottom: '8px' }}>{friendlyTitle}</h2>
          <p style={{ fontSize: '14px', color: 'rgba(255,255,255,0.7)', marginBottom: '24px', lineHeight: 1.5 }}>{friendlyMessage}</p>
          {showRetry && (
            <button
              onClick={handleRetry}
              style={{ padding: '12px 28px', background: '#2d9e57', color: '#fff', borderRadius: '12px', fontSize: '15px', fontWeight: 600, border: 'none', cursor: 'pointer', marginBottom: '12px' }}
            >
              {isRTL ? 'دوبارہ اسکین کریں' : 'Scan Again'}
            </button>
          )}
          <br />
          <button onClick={handleClose} style={{ padding: '10px 24px', background: 'rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.7)', borderRadius: '10px', fontSize: '13px', border: 'none', cursor: 'pointer' }}>
            {isRTL ? 'واپس' : 'Go Back'}
          </button>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="screen active" id="screen-camera">
        <canvas ref={canvasRef} style={{ display: 'none' }} />
        
        <StatusBar background="#000" color="rgba(255,255,255,0.7)" rightLabel="● REC" />
        
        <div className="simple-header" style={{ background: '#000' }}>
          <div className="back-btn" onClick={handleClose} style={{ background: 'rgba(255,255,255,0.1)' }}>
            <ArrowLeft color="#fff" size={20} />
          </div>
          <div>
            <div className="screen-tag">اسکین کریں</div>
            <div className="screen-title">Scan Crop</div>
          </div>
        </div>

        <div className="camera-view" style={{ flex: 1, minHeight: '320px', overflow: 'hidden' }}>
          <div className="camera-bg" style={{ zIndex: 1 }}>
            {(!cameraActive || phase === 'analyzing' || phase === 'validating') ? (
               <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', position: 'absolute', inset: 0, zIndex: 10, background: 'rgba(0,0,0,0.85)' }}>
                 {(phase === 'analyzing' || phase === 'validating') ? (
                   <>
                     <MathLoader />
                     <p style={{ color: 'white', marginTop: '20px', fontSize: '18px', fontWeight: 'bold' }}>
                       {isRTL ? 'تجزیہ ہو رہا ہے...' : 'Analyzing...'}
                     </p>
                     <p style={{ color: 'rgba(255,255,255,0.5)', marginTop: '8px', fontSize: '12px' }}>
                       {isRTL ? 'پہلی بار میں ایک منٹ لگ سکتا ہے' : 'First scan may take up to a minute'}
                     </p>
                   </>
                 ) : (
                   <p style={{ color: 'white' }}>{isRTL ? 'کیمرہ شروع ہو رہا ہے...' : 'Camera starting...'}</p>
                 )}
               </div>
            ) : null}

            <video
              ref={videoRef}
              style={{ objectFit: 'cover', width: '100%', height: '100%', position: 'absolute', inset: 0, zIndex: 0 }}
              playsInline
              muted
              autoPlay
            />

            {phase === 'capturing' && (
              <div style={{ textAlign: 'center', zIndex: 2, position: 'relative' }}>
                <div className="viewfinder">
                  <div className="viewfinder-frame"></div>
                  <div className="corner corner-tl"></div>
                  <div className="corner corner-tr"></div>
                  <div className="corner corner-bl"></div>
                  <div className="corner corner-br"></div>
                  <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <div className="leaf-placeholder">🍃</div>
                  </div>
                </div>
                <div style={{ marginTop: '16px', color: 'rgba(255,255,255,0.9)', fontSize: '14px', background: 'rgba(0,0,0,0.5)', padding: '4px 12px', borderRadius: '12px', display: 'inline-block' }}>
                  {isRTL ? 'پتے کی تصویر لیں' : 'Point at a leaf'}
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="camera-controls pb-24" style={{ zIndex: 2 }}>
          <div className="cam-side-btn" onClick={toggleFlash}>
            <Zap color={flashOn ? "#f59e0b" : "rgba(255,255,255,0.8)"} size={20} />
          </div>
          <div className="shutter" onClick={handleCapture} role="button">
            <div className="shutter-inner"></div>
          </div>
          <div className="cam-side-btn">
            <ImageIcon color="rgba(255,255,255,0.8)" size={20} />
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
