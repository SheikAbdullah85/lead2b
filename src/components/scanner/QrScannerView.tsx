'use client';

import React, { useEffect, useRef, useState } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import { Camera, CameraOff, AlertCircle, Sparkles, RefreshCcw } from 'lucide-react';
import { playSuccessBeep, playWarningBeep } from '@/lib/utils/sound';

interface QrScannerViewProps {
  onScanSuccess: (decodedText: string) => void;
  isScanningActive: boolean;
}

export function QrScannerView({ onScanSuccess, isScanningActive }: QrScannerViewProps) {
  const [scannerError, setScannerError] = useState<string | null>(null);
  const [isCameraRunning, setIsCameraRunning] = useState(false);
  const qrRegionId = 'lead2b-qr-reader';
  const html5QrCodeRef = useRef<Html5Qrcode | null>(null);

  useEffect(() => {
    if (!isScanningActive) {
      stopCamera();
      return;
    }

    startCamera();

    return () => {
      stopCamera();
    };
  }, [isScanningActive]);

  const startCamera = async () => {
    try {
      setScannerError(null);
      if (!html5QrCodeRef.current) {
        html5QrCodeRef.current = new Html5Qrcode(qrRegionId);
      }

      const qrCode = html5QrCodeRef.current;
      if (qrCode.isScanning) {
        return;
      }

      await qrCode.start(
        { facingMode: 'environment' }, // Prefer back camera on mobile
        {
          fps: 15,
          qrbox: { width: 250, height: 250 },
          aspectRatio: 1.0,
        },
        (decodedText) => {
          playSuccessBeep();
          onScanSuccess(decodedText);
        },
        (errorMessage) => {
          // Continuous frame parsing error - normal when no QR in frame
        }
      );

      setIsCameraRunning(true);
    } catch (err: any) {
      console.warn('Camera start error:', err);
      setIsCameraRunning(false);
      if (err.name === 'NotAllowedError' || err.toString().includes('Permission')) {
        setScannerError('Camera access was denied. Please allow camera permissions in your browser.');
      } else {
        setScannerError('Could not start camera on this device. You can use the quick demo badges below.');
      }
      playWarningBeep();
    }
  };

  const stopCamera = async () => {
    if (html5QrCodeRef.current && html5QrCodeRef.current.isScanning) {
      try {
        await html5QrCodeRef.current.stop();
        setIsCameraRunning(false);
      } catch (err) {
        // Ignore stop error
      }
    }
  };

  // Demo badges for instant 1-tap testing without requiring a physical printed badge
  const demoBadges = [
    { label: 'Omar Khashoggi (VIP - Emirates NBD)', code: 'GITEX2026-ATT-00101' },
    { label: 'Jessica Taylor (Director - Accenture)', code: 'GITEX2026-ATT-00102' },
    { label: 'Ahmed Mansoor (Etisalat e&)', code: 'GITEX2026-ATT-00103' },
    { label: 'Chen Wei (Alibaba Cloud)', code: 'GITEX2026-ATT-00104' },
    { label: 'Fatima Al-Zahra (Smart Cities)', code: 'GITEX2026-ATT-00105' },
  ];

  return (
    <div className="w-full flex flex-col items-center">
      {/* Viewfinder Container */}
      <div className="relative w-full max-w-sm aspect-square bg-slate-950 rounded-2xl overflow-hidden border-2 border-slate-700 shadow-2xl flex items-center justify-center">
        <div id={qrRegionId} className="w-full h-full object-cover" />

        {/* Viewfinder Overlay Targeting Guide */}
        <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
          <div className="w-64 h-64 border-2 border-blue-500/80 rounded-2xl relative">
            {/* Corner Crosshairs */}
            <div className="absolute -top-1 -left-1 w-6 h-6 border-t-4 border-l-4 border-blue-400 rounded-tl-lg" />
            <div className="absolute -top-1 -right-1 w-6 h-6 border-t-4 border-r-4 border-blue-400 rounded-tr-lg" />
            <div className="absolute -bottom-1 -left-1 w-6 h-6 border-b-4 border-l-4 border-blue-400 rounded-bl-lg" />
            <div className="absolute -bottom-1 -right-1 w-6 h-6 border-b-4 border-r-4 border-blue-400 rounded-br-lg" />
            
            {/* Scanning line animation */}
            <div className="w-full h-0.5 bg-gradient-to-r from-transparent via-blue-400 to-transparent absolute top-1/2 -translate-y-1/2 animate-pulse" />
          </div>
        </div>

        {/* Camera Permission / Error Fallback */}
        {scannerError && (
          <div className="absolute inset-0 bg-slate-900/90 flex flex-col items-center justify-center p-6 text-center text-white">
            <CameraOff className="w-12 h-12 text-rose-400 mb-3" />
            <p className="text-sm font-semibold text-rose-200 mb-2">Camera Unavailable</p>
            <p className="text-xs text-slate-300 max-w-xs mb-4">{scannerError}</p>
            <button
              onClick={startCamera}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 transition"
            >
              <RefreshCcw className="w-3.5 h-3.5" />
              <span>Retry Camera</span>
            </button>
          </div>
        )}
      </div>

      <p className="text-xs font-medium text-slate-500 mt-3 text-center">
        Point camera at visitor badge QR or 2D barcode for instant lookup
      </p>

      {/* Quick Simulation Badges for instant demo/testing */}
      <div className="w-full max-w-sm mt-5 pt-4 border-t border-slate-200">
        <div className="flex items-center gap-1.5 text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
          <Sparkles className="w-3.5 h-3.5 text-amber-500" />
          <span>Demo Simulation (Tap to Test Fast Scan):</span>
        </div>
        <div className="grid grid-cols-1 gap-1.5">
          {demoBadges.map((b) => (
            <button
              key={b.code}
              onClick={() => {
                playSuccessBeep();
                onScanSuccess(`lead2b:badge:${b.code}`);
              }}
              className="text-left text-xs px-3 py-2 rounded-lg bg-slate-100 hover:bg-blue-50 hover:text-blue-700 hover:border-blue-200 border border-slate-200 transition flex items-center justify-between"
            >
              <span className="font-medium text-slate-800">{b.label}</span>
              <span className="text-[10px] font-mono text-slate-400">{b.code.slice(-5)}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
