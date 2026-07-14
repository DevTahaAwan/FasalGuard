'use client';

import React, { useRef, useState, useCallback, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Zap, Image as ImageIcon } from 'lucide-react';
import { useAppStore } from '@/stores/appStore';
import { useScanStore, type ScanErrorCode } from '@/stores/scanStore';
import { AppLayout } from '@/components/layouts/AppLayout';
import { StatusBar } from '@/components/ui/StatusBar';
import { MOCK_CROPS } from '@/lib/mock/crops';

const CROP_ICONS: Record<string, string> = {
  wheat: '🌾', cotton: '🌿', rice: '🍚', tomato: '🍅', potato: '🥔',
  sugarcane: '🎋', maize: '🌽', onion: '🧅', chilli: '🌶️', mango: '🥭',
};

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
  const [isVisible, setIsVisible] = useState(false);

  // New local state for flow control
  const [view, setView] = useState<'entry' | 'picker' | 'camera' | 'confirm'>('entry');

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = (event: any) => {
    const file = event.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        // Pass the base64 string directly to your existing analysis function
        // @ts-ignore
        handleCapture(reader.result); 
      };
      reader.readAsDataURL(file);
    }
  };
  const [path, setPath] = useState<'A' | 'B' | null>(null);
  const [selectedCropSlugLocal, setSelectedCropSlugLocal] = useState<string | null>(null);
  const [identifiedCrop, setIdentifiedCrop] = useState<{ crop_type_slug: string, crop_name_en: string, crop_name_ur: string, confidence_score: number } | null>(null);
  const [tempImage, setTempImage] = useState<string | null>(null);
  const pathRef = useRef<'A' | 'B' | null>(null);
  const selectedCropSlugRef = useRef<string | null>(null);

  useEffect(() => {
    setIsVisible(true);
  }, []);

  useEffect(() => {
    pathRef.current = path;
  }, [path]);

  useEffect(() => {
    selectedCropSlugRef.current = selectedCropSlugLocal;
  }, [selectedCropSlugLocal]);

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

  // Modified camera lifecycle hook
  useEffect(() => {
    if (view === 'camera' && phase !== 'analyzing' && phase !== 'validating' && phase !== 'error') {
      startCamera();
    } else if (view !== 'camera') {
      stopCamera();
    }
  }, [view, phase, startCamera, stopCamera]);

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

  const processAndAnalyzeImage = async (dataUrl: string, cropSlug: string) => {
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
            body: JSON.stringify({ image: dataUrl, crop_type_slug: cropSlug, language }),
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

  const identifyCrop = async (dataUrl: string) => {
    setCapturedImage(dataUrl);
    setTempImage(dataUrl);
    stopCamera();
    setValidating();
    
    try {
      const res = await fetch('/api/v1/scan/identify-crop', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ image: dataUrl }),
      });
      
      const json = await res.json();
      if (!json.success) {
        setError(json?.error?.code || 'UNKNOWN', json?.error?.message || 'Failed to identify crop');
        return;
      }
      
      setIdentifiedCrop(json.data);
      setView('confirm');
    } catch (err: any) {
      setError('NETWORK_ERROR', err.message);
    }
  };

  const handleCapture = async () => {
    if (typeof window !== 'undefined') {
      (window as any).__shutterFired = ((window as any).__shutterFired || 0) + 1;
      alert('SHUTTER FIRED #' + (window as any).__shutterFired + ' — path=' + path + ' cropSlug=' + selectedCropSlugLocal);
    }
    if (!videoRef.current || !canvasRef.current || !cameraActive) return;

    setValidating();
    if (typeof navigator !== 'undefined' && navigator.vibrate) {
      navigator.vibrate(50);
    }
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
    
    console.log('SHUTTER FIRED — path:', path, 'pathRef:', pathRef.current, 'cropSlug:', selectedCropSlugLocal, 'cropSlugRef:', selectedCropSlugRef.current);
    if (pathRef.current === 'A' && selectedCropSlugRef.current) {
      await processAndAnalyzeImage(smallDataUrl, selectedCropSlugRef.current);
    } else {
      await identifyCrop(smallDataUrl);
    }
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
        
        if (path === 'A' && selectedCropSlugLocal) {
          processAndAnalyzeImage(smallDataUrl, selectedCropSlugLocal);
        } else {
          identifyCrop(smallDataUrl);
        }
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
    if (view !== 'entry') {
      setView('entry');
      setPath(null);
      setTempImage(null);
      setSelectedCropSlugLocal(null);
      setIdentifiedCrop(null);
    } else {
      router.back();
    }
  };

  const handleTryAgain = async () => {
    // 1. Explicitly stop existing camera tracks to free up hardware
    if (videoRef.current && videoRef.current.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      const tracks = stream.getTracks();
      tracks.forEach(track => track.stop());
      videoRef.current.srcObject = null;
    }

    // 2. Reset UI states so the error screen disappears
    reset();

    if (view === 'confirm') {
      setView('camera');
    }
    if (view !== 'camera' && view !== 'confirm') {
      setView('entry');
      setPath(null);
      setTempImage(null);
      setSelectedCropSlugLocal(null);
      setIdentifiedCrop(null);
    } else {
      // 3. Re-initialize the camera properly
      if (startCamera) {
        startCamera(); 
      }
    }
  };

  if (phase === 'error') {
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
          className="screen active transition-opacity duration-500 ease-in-out opacity-100"
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
              onClick={handleTryAgain}
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
              {isRTL ? 'دوبارہ کوشش کریں' : 'Try Again'}
            </button>
          )}
          <br />
          {/* Hidden File Input */}
          <input 
            type="file" 
            accept="image/*" 
            className="hidden" 
            ref={fileInputRef} 
            onChange={handleFileUpload} 
          />

          {/* Update the existing Upload Button */}
          <button 
            onClick={() => fileInputRef.current?.click()}
            className="bg-amber-700 text-white min-h-[48px] min-w-[48px] px-6 py-3 rounded-md font-bold"
          >
            {isRTL ? 'تصویر اپلوڈ کریں' : 'Upload Image'}
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

  if (view === 'entry') {
    return (
      <AppLayout>
        <div className={`screen active transition-opacity duration-500 ease-in-out ${isVisible ? 'opacity-100' : 'opacity-0'}`} style={{ height: '100dvh', display: 'flex', flexDirection: 'column' }}>
          <StatusBar />
          <div className="simple-header">
             <div className="back-btn min-h-[48px] min-w-[48px] flex items-center justify-center p-3" onClick={handleClose}>
               <ArrowLeft size={20} />
             </div>
             <div className="screen-title">
               {isRTL ? (
                 <span className="text-xl font-bold leading-relaxed">اسکین شروع کریں</span>
               ) : (
                 <span className="text-base font-normal">Start Scan</span>
               )}
             </div>
          </div>
          <div className="flex flex-col gap-4 p-6 justify-center flex-1">
             <button onClick={() => { setPath('A'); setView('picker'); }} className="bg-green-600 text-white p-4 rounded-xl min-h-[48px] flex items-center justify-center font-bold text-lg shadow-md">
               {isRTL ? 'مجھے فصل معلوم ہے' : 'I know my crop'}
             </button>
             <button onClick={() => { setPath('B'); setView('camera'); }} className="bg-blue-600 text-white p-4 rounded-xl min-h-[48px] flex items-center justify-center font-bold text-lg shadow-md">
               {isRTL ? 'میری مدد کریں (شناخت)' : 'Help me identify it'}
             </button>
          </div>
        </div>
      </AppLayout>
    );
  }

  if (view === 'picker') {
    return (
      <AppLayout>
        <div className={`screen active transition-opacity duration-500 ease-in-out ${isVisible ? 'opacity-100' : 'opacity-0'}`} style={{ height: '100dvh', display: 'flex', flexDirection: 'column' }}>
          <StatusBar />
          <div className="simple-header">
             <div className="back-btn min-h-[48px] min-w-[48px] flex items-center justify-center p-3" onClick={() => tempImage ? setView('confirm') : setView('entry')}>
               <ArrowLeft size={20} />
             </div>
             <div className="screen-title">
               {isRTL ? (
                 <span className="text-xl font-bold leading-relaxed">فصل منتخب کریں</span>
               ) : (
                 <span className="text-base font-normal">Select Crop</span>
               )}
             </div>
          </div>
          <div className="p-4 grid grid-cols-2 gap-4 overflow-y-auto pb-8 flex-1 content-start">
            {MOCK_CROPS.map(crop => (
               <button key={crop.slug} className="p-4 bg-white border border-gray-200 rounded-xl flex flex-col items-center justify-center min-h-[48px] shadow-sm" onClick={() => {
                 setSelectedCropSlugLocal(crop.slug);
                 if (tempImage) {
                   setView('camera');
                   processAndAnalyzeImage(tempImage, crop.slug);
                 } else {
                   setView('camera');
                 }
               }}>
                 <span className="text-4xl mb-3">{CROP_ICONS[crop.slug] || '🌱'}</span>
                 <span className="font-bold text-gray-800">
                   {isRTL ? (
                     <span className="text-xl font-bold leading-relaxed">{crop.name_ur}</span>
                   ) : (
                     <span className="text-base font-normal">{crop.name_en}</span>
                   )}
                 </span>
               </button>
            ))}
          </div>
        </div>
      </AppLayout>
    );
  }

  if (view === 'confirm' && identifiedCrop) {
    return (
      <AppLayout>
        <div className={`screen active transition-opacity duration-500 ease-in-out ${isVisible ? 'opacity-100' : 'opacity-0'}`} style={{ height: '100dvh', display: 'flex', flexDirection: 'column' }}>
          <StatusBar />
          <div className="simple-header">
             <div className="back-btn min-h-[48px] min-w-[48px] flex items-center justify-center p-3" onClick={() => { setView('camera'); setTempImage(null); setIdentifiedCrop(null); }}>
               <ArrowLeft size={20} />
             </div>
             <div className="screen-title">
               {isRTL ? (
                 <span className="text-xl font-bold leading-relaxed">تصدیق کریں</span>
               ) : (
                 <span className="text-base font-normal">Confirm Crop</span>
               )}
             </div>
          </div>
          <div className="flex flex-col p-6 items-center flex-1">
             {tempImage && <img src={tempImage} alt="Captured" className="w-48 h-48 object-cover rounded-2xl mb-6 shadow-md border-4 border-white" />}
             <h2 className="text-2xl font-bold text-center mb-8 text-gray-800">
               {isRTL 
                 ? `یہ ${identifiedCrop.crop_name_ur} لگ رہا ہے۔ کیا یہ درست ہے؟`
                 : `This looks like ${identifiedCrop.crop_name_en}. Is this correct?`}
             </h2>
             <div className="w-full flex flex-col gap-4 mt-auto pb-4">
               <button onClick={() => {
                 setView('camera');
                 processAndAnalyzeImage(tempImage!, identifiedCrop.crop_type_slug);
               }} className="bg-green-600 text-white p-4 rounded-xl min-h-[48px] flex items-center justify-center font-bold text-lg shadow-md w-full">
                 {isRTL ? 'ہاں، جاری رکھیں' : 'Yes, continue'}
               </button>
               <button onClick={() => {
                 setPath('A');
                 setView('picker');
               }} className="bg-amber-500 text-white p-4 rounded-xl min-h-[48px] flex items-center justify-center font-bold text-lg shadow-md w-full">
                 {isRTL ? 'نہیں، مجھے منتخب کرنے دیں' : 'No, let me pick'}
               </button>
             </div>
          </div>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div
        className={`screen active transition-opacity duration-500 ease-in-out ${isVisible ? 'opacity-100' : 'opacity-0'}`}
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
          <div className="back-btn min-h-[48px] min-w-[48px] flex items-center justify-center p-3" onClick={handleClose} style={{ background: 'var(--border)' }}>
            <ArrowLeft color="var(--fg)" size={20} />
          </div>
          <div>
            {isRTL ? (
              <span className="text-xl font-bold leading-relaxed">اسکین کریں</span>
            ) : (
              <span className="text-base font-normal">Scan Crop</span>
            )}
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
                  <div className="w-full flex flex-col gap-4 p-6">
                    <div className="h-64 w-full bg-gray-300 animate-pulse rounded-lg"></div>
                    <div className="h-8 w-3/4 bg-gray-300 animate-pulse rounded-md"></div>
                    <div className="h-4 w-full bg-gray-300 animate-pulse rounded-md"></div>
                    <div className="h-4 w-5/6 bg-gray-300 animate-pulse rounded-md"></div>
                    <div className="h-4 w-4/6 bg-gray-300 animate-pulse rounded-md mt-4"></div>
                  </div>
                ) : (
                  <p style={{ color: 'var(--fg)' }}>
                    {isRTL ? (
                      <span className="text-xl font-bold leading-relaxed">کیمرہ شروع ہو رہا ہے...</span>
                    ) : (
                      <span className="text-base font-normal">Camera starting...</span>
                    )}
                  </p>
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
                  {isRTL ? (
                    <span className="text-xl font-bold leading-relaxed">پتے یا پھل پر کیمرہ رکھیں</span>
                  ) : (
                    <span className="text-base font-normal">Point at a leaf or fruit</span>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="camera-controls pb-24" style={{ zIndex: 2 }}>
          <div className="cam-side-btn min-h-[48px] min-w-[48px] flex items-center justify-center p-3" onClick={toggleFlash} style={{ background: 'var(--border)' }}>
            <Zap color={flashOn ? 'var(--amber)' : 'var(--fg)'} size={20} />
          </div>
          <div className="shutter min-h-[48px] min-w-[48px] flex items-center justify-center p-3" onClick={handleCapture} role="button">
            <div className="shutter-inner"></div>
          </div>
          <div className="cam-side-btn min-h-[48px] min-w-[48px] flex items-center justify-center p-3" onClick={() => galleryInputRef.current && galleryInputRef.current.click()} style={{ background: 'var(--border)' }}>
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