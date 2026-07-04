'use client';

import React, { useRef, useState, useCallback, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Zap, Image as ImageIcon } from 'lucide-react';
import { useAppStore } from '@/stores/appStore';
import { useScanStore, type ScanErrorCode } from '@/stores/scanStore';
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
  const galleryInputRef = useRef<HTMLInputElement>(null);
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

  const processAndAnalyzeImage = async (dataUrl: string) => {
    setCapturedImage(dataUrl);
    stopCamera();
    setAnalyzing();

    try {
      const MAX_RETRIES = 2;
      let lastError = '';
      let lastErrorCode = '';
      let succeeded = false;

      for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
        let res: Response | null = null;

        try {
          res = await fetch('/api/v1/scan/analyze', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ image: dataUrl, language }),
          });
        } catch (fetchErr: any) {
          lastError = fetchErr.message || 'Network error';
          lastErrorCode = 'NETWORK_ERROR';
          if (attempt < MAX_RETRIES - 1) {
            await new Promise((resolve) => setTimeout(resolve, 1500));
            continue;
          }
          break;
        }

        if (!res.ok) {
          try {
            const errJson = await res.json();
            lastErrorCode = errJson?.error?.code || String(res.status);
            lastError =
              errJson?.error?.message || errJson?.message || errJson?.error || 'Classification failed';
          } catch {
            lastErrorCode = String(res.status);
            lastError = 'Classification failed';
          }
          break;
        }

        let json: any = null;
        try {
          json = await res.json();
        } catch {
          lastError = 'Invalid response from server';
          lastErrorCode = 'PARSE_ERROR';
          break;
        }

        if (!json.success) {
          lastErrorCode = json?.error?.code || 'UNKNOWN';
          lastError = json?.message || json?.error?.message || 'Classification failed';
          break;
        }

        setAnalyzeResult(json.data);
        router.push(`/diagnosis/${json.data.scan_id}`);
        succeeded = true;
        break;
      }

      if (!succeeded) {
        setError((lastErrorCode as ScanErrorCode) || 'UNKNOWN', lastError || 'Something went wrong. Please try scanning again.');
      }
    } catch (outerErr: any) {
      console.error('Analysis error:', outerErr);
      setError('UNKNOWN', outerErr.message || 'Something went wrong. Please try scanning again.');
    }
  };

  const handleCapture = async () => {
    if (!videoRef.current || !canvasRef.current || !cameraActive) return;

    setValidating();
    const video = videoRef.current;
    const canvas = canvasRef.current;

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    const resizeCanvas = document.createElement('canvas');
    resizeCanvas.width = 224;
    resizeCanvas.height = 224;
    const resizeCtx = resizeCanvas.getContext('2d');
    if (!resizeCtx) return;
    resizeCtx.drawImage(canvas, 0, 0, 224, 224);

    const smallDataUrl = resizeCanvas.toDataURL('image/jpeg', 0.8);
    await processAndAnalyzeImage(smallDataUrl);
  };

  const handleGallerySelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files && e.target.files[0];
    if (!file) return;

    // Reset input so same file can be selected again
    e.target.value = '';
    
    setValidating();

    const reader = new FileReader();
    reader.onload = () => {
      const img = new Image();
      img.onload = () => {
        const resizeCanvas = document.createElement('canvas');
        resizeCanvas.width = 224;
        resizeCanvas.height = 224;
        const resizeCtx = resizeCanvas.getContext('2d');
        if (!resizeCtx) return;
        
        // Center crop the image
        const size = Math.min(img.width, img.height);
        const startX = (img.width - size) / 2;
        const startY = (img.height - size) / 2;
        
        resizeCtx.drawImage(img, startX, startY, size, size, 0, 0, 224, 224);
        
        const smallDataUrl = resizeCanvas.toDataURL('image/jpeg', 0.8);
        processAndAnalyzeImage(smallDataUrl);
      };
      img.onerror = () => {
        setError('UNKNOWN', 'Failed to read image file');
      };
      img.src = reader.result as string;
    };
    reader.onerror = () => setError('UNKNOWN', 'Failed to read file');
    reader.readAsDataURL(file);
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
    // Error copy now keyed off the REAL error_code the backend returns,
    // not a guess based on whether the word "fetch" happens to appear in
    // the message. See route.ts for the authoritative code list:
    // NOT_A_PLANT, LOW_CONFIDENCE, MISSING_IMAGE, PARSE_ERROR, CAMERA_DENIED,
    // NETWORK_ERROR, UNKNOWN.
    let friendlyTitle = isRTL ? 'خرابی' : 'Something went wrong';
    let friendlyMessage = errorMessage || (isRTL ? 'دوبارہ کوشش کریں۔' : 'Please try again.');
    const showRetry = true;

    switch (errorCode) {
      case 'NOT_A_PLANT':
        friendlyTitle = isRTL ? 'پودا نظر نہیں آیا' : 'No plant detected';
        friendlyMessage = isRTL
          ? 'تصویر میں فصل یا پودا واضح نہیں۔ براہ کرم دوبارہ تصویر لیں۔'
          : "This photo doesn't clearly show a plant or crop. Please retake it.";
        break;
      case 'LOW_CONFIDENCE':
        friendlyTitle = isRTL ? 'واضح تصویر درکار ہے' : 'Image not clear enough';
        friendlyMessage = isRTL
          ? 'بیماری کی شناخت یقین سے نہیں ہو سکی۔ روشنی میں واضح تصویر لیں۔'
          : 'Could not confidently identify the condition. Try a clearer, well-lit photo of the affected leaf.';
        break;
      case 'CAMERA_DENIED':
        friendlyTitle = isRTL ? 'کیمرے کی اجازت درکار ہے' : 'Camera permission needed';
        friendlyMessage = isRTL
          ? 'براہ کرم کیمرے تک رسائی کی اجازت دیں۔'
          : 'Please allow camera access in your browser settings and try again.';
        break;
      case 'NETWORK_ERROR':
        friendlyTitle = isRTL ? 'رابطہ منقطع' : 'Connection problem';
        friendlyMessage = isRTL
          ? 'انٹرنیٹ کنکشن چیک کریں اور دوبارہ کوشش کریں۔'
          : 'Please check your internet connection and try again.';
        break;
      default:
        break;
    }

    return (
      <AppLayout>
        <div
          className="screen active"
          style={{
            backgroundColor: 'var(--bg)',
            color: 'var(--fg)',
            justifyContent: 'center',
            alignItems: 'center',
            padding: '32px',
            textAlign: 'center',
          }}
        >
          <div style={{ fontSize: '48px', marginBottom: '16px' }}>🌿</div>
          <h2 style={{ fontSize: '20px', fontWeight: 700, marginBottom: '8px' }}>{friendlyTitle}</h2>
          <p style={{ fontSize: '14px', color: 'var(--fg2)', marginBottom: '24px', lineHeight: 1.5 }}>
            {friendlyMessage}
          </p>
          {showRetry && (
            <button
              onClick={handleRetry}
              style={{
                padding: '12px 28px',
                background: 'var(--green-accent)',
                color: '#fff',
                borderRadius: 'var(--radius-btn, 12px)',
                fontSize: '15px',
                fontWeight: 600,
                border: 'none',
                cursor: 'pointer',
                marginBottom: '12px',
              }}
            >
              {isRTL ? 'دوبارہ اسکین کریں' : 'Scan Again'}
            </button>
          )}
          <br />
          <button
            onClick={() => galleryInputRef.current?.click()}
            style={{
              padding: '12px 28px',
              background: 'var(--amber)',
              color: '#fff',
              borderRadius: 'var(--radius-btn, 12px)',
              fontSize: '15px',
              fontWeight: 600,
              border: 'none',
              cursor: 'pointer',
              marginBottom: '12px',
            }}
          >
            {isRTL ? 'گیلری سے اپلوڈ کریں' : 'Upload Image'}
          </button>
          <br />
          <button
            onClick={handleClose}
            style={{
              padding: '10px 24px',
              background: 'var(--border)',
              color: 'var(--fg2)',
              borderRadius: 'var(--radius-btn, 10px)',
              fontSize: '13px',
              border: 'none',
              cursor: 'pointer',
            }}
          >
            {isRTL ? 'واپس' : 'Go Back'}
          </button>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div
        className="screen active"
        id="screen-camera"
        style={{
          height: '100dvh',
          maxHeight: '100dvh',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        <canvas ref={canvasRef} style={{ display: 'none' }} />

        <StatusBar background="var(--bg)" color="var(--fg2)" rightLabel="● REC" />

        <div className="simple-header" style={{ background: 'var(--bg)' }}>
          <div className="back-btn" onClick={handleClose} style={{ background: 'var(--border)' }}>
            <ArrowLeft color="var(--fg)" size={20} />
          </div>
          <div>
            <div className="screen-tag">اسکین کریں</div>
            <div className="screen-title">Scan Crop</div>
          </div>
        </div>

        <div className="camera-view" style={{ flex: 1, minHeight: 0, overflow: 'hidden' }}>
          <div className="camera-bg" style={{ zIndex: 1 }}>
            {!cameraActive || phase === 'analyzing' || phase === 'validating' ? (
              <div
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  position: 'absolute',
                  inset: 0,
                  zIndex: 10,
                  background: 'var(--bg)',
                  opacity: 0.95,
                }}
              >
                {phase === 'analyzing' || phase === 'validating' ? (
                  <>
                    <MathLoader />
                    <p style={{ color: 'var(--fg)', marginTop: '20px', fontSize: '18px', fontWeight: 'bold' }}>
                      {isRTL ? 'تجزیہ ہو رہا ہے...' : 'Analyzing...'}
                    </p>
                    <p style={{ color: 'var(--fg2)', marginTop: '8px', fontSize: '12px' }}>
                      {isRTL ? 'چند سیکنڈ میں نتیجہ آ جائے گا' : 'Result in a few seconds'}
                    </p>
                  </>
                ) : (
                  <p style={{ color: 'var(--fg)' }}>{isRTL ? 'کیمرہ شروع ہو رہا ہے...' : 'Camera starting...'}</p>
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
                <div
                  style={{
                    marginTop: '16px',
                    color: 'var(--fg)',
                    fontSize: '14px',
                    background: 'var(--bg)',
                    padding: '4px 12px',
                    borderRadius: '12px',
                    display: 'inline-block',
                    boxShadow: 'var(--shadow-card)',
                  }}
                >
                  {isRTL ? 'پتے یا پھل پر کیمرہ رکھیں' : 'Point at a leaf or fruit'}
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="camera-controls pb-24" style={{ zIndex: 2 }}>
          <div className="cam-side-btn" onClick={toggleFlash} style={{ background: 'var(--border)' }}>
            <Zap color={flashOn ? 'var(--amber)' : 'var(--fg)'} size={20} />
          </div>
          <div className="shutter" onClick={handleCapture} role="button">
            <div className="shutter-inner"></div>
          </div>
          <div className="cam-side-btn" onClick={() => galleryInputRef.current && galleryInputRef.current.click()} style={{ background: 'var(--border)' }}>
            <ImageIcon color="var(--fg)" size={20} />
          </div>
          <input
            ref={galleryInputRef}
            type="file"
            accept="image/*"
            capture="environment"
            id="gallery-input"
            style={{ display: 'none' }}
            onChange={handleGallerySelect}
          />
        </div>
      </div>
    </AppLayout>
  );
}