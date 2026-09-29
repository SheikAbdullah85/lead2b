'use client';

import React, { useEffect, useRef, useState, useCallback } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import {
  Camera,
  CameraOff,
  Sparkles,
  RefreshCcw,
  QrCode,
  Image as ImageIcon,
  Zap,
  ZapOff,
  SwitchCamera,
  ShieldAlert,
  Info,
  X,
  CheckCircle2,
  AlertTriangle,
  Loader2,
} from 'lucide-react';
import { playSuccessBeep, playWarningBeep } from '@/lib/utils/sound';

interface QrScannerViewProps {
  onScanSuccess: (decodedText: string) => void;
  isScanningActive: boolean;
}

export function QrScannerView({ onScanSuccess, isScanningActive }: QrScannerViewProps) {
  const qrRegionId = 'lead2b-qr-reader';
  const html5QrCodeRef = useRef<Html5Qrcode | null>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const galleryInputRef = useRef<HTMLInputElement>(null);

  const [scannerError, setScannerError] = useState<string | null>(null);
  const [isCameraRunning, setIsCameraRunning] = useState(false);
  const [isProcessingFile, setIsProcessingFile] = useState(false);
  const [fileScanError, setFileScanError] = useState<string | null>(null);
  const [isSecure, setIsSecure] = useState(true);
  const [cameras, setCameras] = useState<Array<{ id: string; label: string }>>([]);
  const [currentCameraIdx, setCurrentCameraIdx] = useState(0);
  const [hasTorch, setHasTorch] = useState(false);
  const [isTorchOn, setIsTorchOn] = useState(false);
  const [showHttpsModal, setShowHttpsModal] = useState(false);

  // Check secure context on mount
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const isSec =
        window.isSecureContext ||
        window.location.hostname === 'localhost' ||
        window.location.hostname === '127.0.0.1';
      setIsSecure(isSec);
    }
  }, []);

  // Stop camera helper
  const stopCamera = useCallback(async () => {
    if (html5QrCodeRef.current && html5QrCodeRef.current.isScanning) {
      try {
        await html5QrCodeRef.current.stop();
      } catch (err) {
        // Safe ignore
      }
      setIsCameraRunning(false);
      setIsTorchOn(false);
    }
  }, []);

  // Start live stream camera
  const startCamera = useCallback(async (cameraIndexToUse?: number) => {
    try {
      setScannerError(null);
      setFileScanError(null);

      // Verify browser capability
      if (typeof navigator === 'undefined' || !navigator.mediaDevices?.getUserMedia) {
        setScannerError(
          'Mobile browsers restrict live camera stream over insecure HTTP. Use the "Take Photo with Phone Camera" button below.'
        );
        setIsCameraRunning(false);
        return;
      }

      if (!html5QrCodeRef.current) {
        html5QrCodeRef.current = new Html5Qrcode(qrRegionId);
      }

      const qrCode = html5QrCodeRef.current;
      if (qrCode.isScanning) {
        await qrCode.stop();
      }

      // Query available video devices
      let availableCameras: Array<{ id: string; label: string }> = [];
      try {
        availableCameras = await Html5Qrcode.getCameras();
        setCameras(availableCameras);
      } catch (e) {
        // Enumeration can fail if permissions not yet granted
      }

      // Determine camera constraint:
      // Try preferred rear camera index if cameras enumerated, or fallback to environment facingMode
      let cameraConfig: any = { facingMode: 'environment' };

      if (availableCameras.length > 0) {
        const targetIdx =
          typeof cameraIndexToUse === 'number'
            ? cameraIndexToUse % availableCameras.length
            : availableCameras.findIndex(
                (c) =>
                  c.label.toLowerCase().includes('back') ||
                  c.label.toLowerCase().includes('rear') ||
                  c.label.toLowerCase().includes('environment')
              );

        const chosenIdx = targetIdx !== -1 ? targetIdx : availableCameras.length - 1;
        setCurrentCameraIdx(chosenIdx);
        cameraConfig = availableCameras[chosenIdx].id;
      }

      await qrCode.start(
        cameraConfig,
        {
          fps: 20,
          qrbox: { width: 260, height: 260 },
          aspectRatio: 1.0,
        },
        (decodedText) => {
          playSuccessBeep();
          onScanSuccess(decodedText);
        },
        () => {
          // Normal frame loop
        }
      );

      setIsCameraRunning(true);

      // Check for torch capability
      try {
        const capabilities = qrCode.getRunningTrackCameraCapabilities();
        if (capabilities && (capabilities as any).torchFeature?.().isSupported()) {
          setHasTorch(true);
        } else {
          setHasTorch(false);
        }
      } catch (e) {
        setHasTorch(false);
      }
    } catch (err: any) {
      setIsCameraRunning(false);
      const errMsg = err?.message || err?.toString() || '';
      console.warn('Camera start error:', errMsg);

      if (err?.name === 'NotAllowedError' || errMsg.includes('Permission')) {
        setScannerError('Camera access denied. Please grant camera permissions in your mobile browser.');
      } else if (err?.name === 'OverconstrainedError' || errMsg.includes('Overconstrained')) {
        // Fallback: try starting with user facing mode or generic camera
        try {
          if (html5QrCodeRef.current) {
            await html5QrCodeRef.current.start(
              { facingMode: 'user' },
              { fps: 15, qrbox: { width: 250, height: 250 } },
              (decodedText) => {
                playSuccessBeep();
                onScanSuccess(decodedText);
              },
              () => {}
            );
            setIsCameraRunning(true);
            return;
          }
        } catch (fallbackErr) {
          setScannerError('Camera stream unavailable. Use "Take Photo with Phone Camera" below.');
        }
      } else {
        setScannerError(
          'Live camera stream is disabled on this network protocol or browser. Use "Take Photo with Phone Camera" below.'
        );
      }
    }
  }, [onScanSuccess]);

  // Flip / Switch camera
  const handleFlipCamera = async () => {
    if (cameras.length <= 1) return;
    const nextIdx = (currentCameraIdx + 1) % cameras.length;
    setCurrentCameraIdx(nextIdx);
    await startCamera(nextIdx);
  };

  // Toggle flashlight / torch
  const handleToggleTorch = async () => {
    if (!html5QrCodeRef.current || !hasTorch) return;
    try {
      const nextTorch = !isTorchOn;
      const capabilities = html5QrCodeRef.current.getRunningTrackCameraCapabilities();
      if ((capabilities as any).torchFeature?.().isSupported()) {
        await (capabilities as any).torchFeature().apply(nextTorch);
        setIsTorchOn(nextTorch);
      }
    } catch (err) {
      console.warn('Torch toggle error:', err);
    }
  };

  // Handle native mobile camera snap or gallery photo upload
  const handleFileScanned = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Reset input so user can pick the same file again if retrying
    e.target.value = '';

    setIsProcessingFile(true);
    setFileScanError(null);

    try {
      if (!html5QrCodeRef.current) {
        html5QrCodeRef.current = new Html5Qrcode(qrRegionId);
      }

      // Decode QR from file
      const decodedText = await html5QrCodeRef.current.scanFile(file, false);
      if (decodedText) {
        playSuccessBeep();
        onScanSuccess(decodedText);
      }
    } catch (err: any) {
      playWarningBeep();
      setFileScanError('No badge QR detected in this photo. Hold steady, aim closely, and snap again.');
    } finally {
      setIsProcessingFile(false);
    }
  };

  useEffect(() => {
    if (!isScanningActive) {
      stopCamera();
      return;
    }

    startCamera();

    return () => {
      stopCamera();
    };
  }, [isScanningActive, startCamera, stopCamera]);

  // Demo badges for instant 1-tap evaluation
  const demoBadges = [
    { label: 'Omar Khashoggi', company: 'Emirates NBD', role: 'VP Tech', tag: 'VIP', code: 'GITEX2026-ATT-00101' },
    { label: 'Jessica Taylor', company: 'Accenture ME', role: 'Director AI', tag: 'VIP', code: 'GITEX2026-ATT-00102' },
    { label: 'Ahmed Mansoor', company: 'Etisalat e&', role: 'Head of Cloud', tag: 'Trade', code: 'GITEX2026-ATT-00103' },
    { label: 'Fatima Al-Zahra', company: 'Dubai Municipality', role: 'Director Smart Cities', tag: 'VIP', code: 'GITEX2026-ATT-00105' },
  ];

  return (
    <div className="w-full flex flex-col items-center">
      {/* Hidden Native File Inputs for 100% Mobile Camera Compatibility */}
      <input
        type="file"
        accept="image/*"
        capture="environment"
        ref={cameraInputRef}
        onChange={handleFileScanned}
        className="hidden"
      />
      <input
        type="file"
        accept="image/*"
        ref={galleryInputRef}
        onChange={handleFileScanned}
        className="hidden"
      />

      {/* Insecure Context (HTTP on LAN) Banner */}
      {!isSecure && (
        <div className="w-full max-w-sm mb-3 p-3 bg-amber-50 border border-amber-300 rounded-2xl text-amber-900 shadow-xs">
          <div className="flex items-start gap-2">
            <ShieldAlert className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="text-xs font-bold">Mobile HTTP Network Notice</p>
              <p className="text-[11px] text-amber-800 leading-snug mt-0.5">
                Mobile browsers require HTTPS for live video stream. Use the high-res{' '}
                <span className="font-bold underline">"Take Photo with Phone Camera"</span> button below for 100% reliable scanning over Wi-Fi.
              </p>
            </div>
            <button
              onClick={() => setShowHttpsModal(true)}
              className="text-amber-700 hover:text-amber-900 p-1"
              title="HTTPS Info"
            >
              <Info className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Main Viewfinder Card */}
      <div className="relative w-full max-w-sm aspect-square bg-slate-950 rounded-3xl overflow-hidden border-2 border-slate-700 shadow-2xl flex items-center justify-center">
        {/* Render area for Html5Qrcode */}
        <div id={qrRegionId} className="w-full h-full object-cover" />

        {/* Viewfinder Overlay Targeting Guide (Only when camera running) */}
        {isCameraRunning && !isProcessingFile && (
          <div className="absolute inset-0 pointer-events-none flex items-center justify-center p-6">
            <div className="w-64 h-64 border border-[#00838f]/40 rounded-2xl relative flex items-center justify-center overflow-hidden">
              <div className="absolute -top-0.5 -left-0.5 w-7 h-7 border-t-4 border-l-4 border-[#22d3ee] rounded-tl-xl" />
              <div className="absolute -top-0.5 -right-0.5 w-7 h-7 border-t-4 border-r-4 border-[#22d3ee] rounded-tr-xl" />
              <div className="absolute -bottom-0.5 -left-0.5 w-7 h-7 border-b-4 border-l-4 border-[#22d3ee] rounded-bl-xl" />
              <div className="absolute -bottom-0.5 -right-0.5 w-7 h-7 border-b-4 border-r-4 border-[#22d3ee] rounded-br-xl" />
              <div className="w-full h-1 bg-gradient-to-r from-transparent via-[#22d3ee] to-transparent shadow-[0_0_12px_#22d3ee] animate-laser" />
            </div>
          </div>
        )}

        {/* Camera Active Controls (Flip & Flashlight) */}
        {isCameraRunning && (
          <div className="absolute top-3 right-3 flex items-center gap-2 z-10">
            {hasTorch && (
              <button
                type="button"
                onClick={handleToggleTorch}
                className={`p-2 rounded-full backdrop-blur-md transition ${
                  isTorchOn
                    ? 'bg-amber-400 text-slate-950 shadow-md shadow-amber-400/50'
                    : 'bg-slate-900/80 text-white border border-slate-700'
                }`}
                title={isTorchOn ? 'Turn Flashlight Off' : 'Turn Flashlight On'}
              >
                {isTorchOn ? <Zap className="w-4 h-4 fill-current" /> : <ZapOff className="w-4 h-4" />}
              </button>
            )}
            {cameras.length > 1 && (
              <button
                type="button"
                onClick={handleFlipCamera}
                className="p-2 rounded-full bg-slate-900/80 text-white border border-slate-700 backdrop-blur-md hover:bg-slate-800 transition"
                title="Flip Camera (Front/Rear)"
              >
                <SwitchCamera className="w-4 h-4" />
              </button>
            )}
          </div>
        )}

        {/* Photo Decoding Progress Spinner */}
        {isProcessingFile && (
          <div className="absolute inset-0 bg-slate-950/95 flex flex-col items-center justify-center p-6 text-center text-white z-20">
            <Loader2 className="w-10 h-10 text-[#22d3ee] animate-spin mb-3" />
            <p className="text-sm font-bold text-slate-100">Scanning Badge Photo...</p>
            <p className="text-xs text-slate-400 mt-1">Analyzing QR code matrix</p>
          </div>
        )}

        {/* Camera Fallback / Not Allowed Overlay */}
        {!isCameraRunning && !isProcessingFile && (
          <div className="absolute inset-0 bg-slate-950/95 flex flex-col items-center justify-center p-6 text-center text-white z-10">
            <div className="w-12 h-12 rounded-full bg-[#00838f]/20 text-[#22d3ee] flex items-center justify-center mb-3 border border-[#00838f]/40">
              <Camera className="w-6 h-6" />
            </div>
            <p className="text-sm font-bold text-slate-100 mb-1">
              {!isSecure ? 'Mobile Native Camera Ready' : 'Live Camera Stream Inactive'}
            </p>
            <p className="text-xs text-slate-400 max-w-xs mb-4 leading-relaxed">
              {scannerError || 'Tap "Take Photo with Phone Camera" below to capture and decode any badge instantly.'}
            </p>

            <div className="flex flex-col gap-2 w-full max-w-xs">
              <button
                type="button"
                onClick={() => cameraInputRef.current?.click()}
                className="w-full py-3 bg-[#00838f] hover:bg-[#006d77] text-white rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition shadow-lg shadow-teal-900/50"
              >
                <Camera className="w-4 h-4" />
                <span>Take Photo with Phone Camera</span>
              </button>

              {isSecure && (
                <button
                  type="button"
                  onClick={() => startCamera()}
                  className="w-full py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-medium flex items-center justify-center gap-1.5 transition"
                >
                  <RefreshCcw className="w-3.5 h-3.5" />
                  <span>Retry Live Camera Stream</span>
                </button>
              )}
            </div>
          </div>
        )}
      </div>

      {/* File Decoding Error Notification */}
      {fileScanError && (
        <div className="w-full max-w-sm mt-3 p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-900 text-xs flex items-start justify-between gap-2 animate-in fade-in">
          <div className="flex items-start gap-2">
            <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
            <span>{fileScanError}</span>
          </div>
          <button
            onClick={() => setFileScanError(null)}
            className="text-rose-500 hover:text-rose-700 p-0.5"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Primary Mobile Action Buttons */}
      <div className="w-full max-w-sm mt-3 grid grid-cols-2 gap-2">
        <button
          type="button"
          onClick={() => cameraInputRef.current?.click()}
          className="py-3 px-3 rounded-xl bg-[#00838f] hover:bg-[#006d77] text-white text-xs font-bold flex items-center justify-center gap-2 shadow-sm transition active:scale-95"
        >
          <Camera className="w-4 h-4 text-cyan-200" />
          <span>Snap Badge Photo</span>
        </button>

        <button
          type="button"
          onClick={() => galleryInputRef.current?.click()}
          className="py-3 px-3 rounded-xl bg-white hover:bg-slate-50 border border-slate-300 text-slate-700 text-xs font-bold flex items-center justify-center gap-2 shadow-2xs transition active:scale-95"
        >
          <ImageIcon className="w-4 h-4 text-slate-500" />
          <span>Upload Image</span>
        </button>
      </div>

      <p className="text-[11px] font-medium text-slate-400 mt-2 text-center">
        Works with all visitor badges, vCards, conference passes, and QR codes
      </p>

      {/* 1-Tap Realistic GITEX Simulation Badges */}
      <div className="w-full max-w-sm mt-4 pt-3 border-t border-slate-200">
        <div className="flex items-center justify-between text-xs font-black text-slate-700 uppercase tracking-wider mb-2">
          <span className="flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-[#00838f]" />
            <span>Demo Badge Scanner (1-Tap):</span>
          </span>
          <span className="text-[10px] text-teal-700 font-mono">GITEX 2026</span>
        </div>

        <div className="grid grid-cols-1 gap-1.5">
          {demoBadges.map((b) => (
            <button
              key={b.code}
              onClick={() => {
                playSuccessBeep();
                onScanSuccess(`lead2b:badge:${b.code}`);
              }}
              className="text-left p-2.5 rounded-xl bg-white hover:bg-teal-50/50 hover:border-teal-400 border border-slate-200 transition flex items-center justify-between shadow-2xs group cursor-pointer"
            >
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-bold text-slate-900 text-xs">{b.label}</span>
                  <span
                    className={`text-[9px] font-black uppercase px-1.5 py-0.2 rounded ${
                      b.tag === 'VIP' ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-600'
                    }`}
                  >
                    {b.tag}
                  </span>
                </div>
                <p className="text-[11px] text-slate-500">
                  {b.role} • {b.company}
                </p>
              </div>
              <span className="text-[10px] font-mono font-bold text-teal-700 bg-teal-50 px-2 py-0.5 rounded border border-teal-200">
                Tap Scan
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* HTTPS / Mobile Setup Help Modal */}
      {showHttpsModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in">
          <div className="bg-white rounded-2xl max-w-sm w-full p-5 shadow-2xl border border-slate-200 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-slate-900 font-bold text-sm">
                <ShieldAlert className="w-4 h-4 text-[#00838f]" />
                <span>Mobile Camera Over Local Network</span>
              </div>
              <button
                onClick={() => setShowHttpsModal(false)}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-2.5 text-xs text-slate-600 leading-relaxed">
              <p>
                Mobile browsers (Apple Safari on iOS and Google Chrome on Android) have a strict security policy:
              </p>
              <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-200 font-mono text-[11px] text-slate-800">
                Live video stream requires HTTPS or localhost
              </div>
              <p className="font-semibold text-slate-800">Two ways to scan on your phone:</p>
              <ul className="space-y-1.5 list-disc pl-4 text-[11px]">
                <li>
                  <span className="font-bold text-teal-700">1. Tap "Snap Badge Photo" (Recommended):</span> Opens your phone's native camera immediately without needing HTTPS.
                </li>
                <li>
                  <span className="font-bold text-slate-800">2. Run with HTTPS:</span> Run <code className="bg-slate-100 px-1 py-0.5 rounded font-mono text-slate-700">npm run dev:https</code> or use a local SSL tunnel (ngrok / Cloudflare Tunnel).
                </li>
              </ul>
            </div>

            <button
              onClick={() => setShowHttpsModal(false)}
              className="w-full py-2.5 bg-[#00838f] text-white rounded-xl text-xs font-bold hover:bg-[#006d77] transition"
            >
              Got it, understood
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
