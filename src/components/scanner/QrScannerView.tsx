'use client';

import React, { useEffect, useRef, useState } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import { Camera, CameraOff, AlertCircle, Sparkles, RefreshCcw, QrCode } from 'lucide-react';
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
        { facingMode: 'environment' }, // Prefer rear camera on mobile
        {
          fps: 20,
          qrbox: { width: 260, height: 260 },
          aspectRatio: 1.0,
        },
        (decodedText) => {
          playSuccessBeep();
          onScanSuccess(decodedText);
        },
        (errorMessage) => {
          // Normal frame loop
        }
      );

      setIsCameraRunning(true);
    } catch (err: any) {
      setIsCameraRunning(false);
      if (err.name === 'NotAllowedError' || err.toString().includes('Permission')) {
        setScannerError('Camera access was denied. Please allow camera permissions in browser settings.');
      } else {
        setScannerError('Camera unavailable on this browser/environment. Use the 1-tap simulation badges below.');
      }
      playWarningBeep();
    }
  };

  const stopCamera = async () => {
    if (html5QrCodeRef.current && html5QrCodeRef.current.isScanning) {
      try {
        await html5QrCodeRef.current.stop();
        setIsCameraRunning(false);
      } catch (err) {}
    }
  };

  // Demo badges for instant 1-tap evaluation without physical badges
  const demoBadges = [
    { label: 'Omar Khashoggi', company: 'Emirates NBD', role: 'VP Tech', tag: 'VIP', code: 'GITEX2026-ATT-00101' },
    { label: 'Jessica Taylor', company: 'Accenture ME', role: 'Director AI', tag: 'VIP', code: 'GITEX2026-ATT-00102' },
    { label: 'Ahmed Mansoor', company: 'Etisalat e&', role: 'Head of Cloud', tag: 'Trade', code: 'GITEX2026-ATT-00103' },
    { label: 'Fatima Al-Zahra', company: 'Dubai Municipality', role: 'Director Smart Cities', tag: 'VIP', code: 'GITEX2026-ATT-00105' },
  ];

  return (
    <div className="w-full flex flex-col items-center">
      {/* High-Tech Camera Viewfinder */}
      <div className="relative w-full max-w-sm aspect-square bg-slate-950 rounded-3xl overflow-hidden border-2 border-slate-700 shadow-2xl flex items-center justify-center">
        <div id={qrRegionId} className="w-full h-full object-cover" />

        {/* Viewfinder Overlay Targeting Guide */}
        <div className="absolute inset-0 pointer-events-none flex items-center justify-center p-6">
          <div className="w-64 h-64 border border-[#00838f]/40 rounded-2xl relative flex items-center justify-center overflow-hidden">
            {/* Corner Crosshairs */}
            <div className="absolute -top-0.5 -left-0.5 w-7 h-7 border-t-4 border-l-4 border-[#22d3ee] rounded-tl-xl" />
            <div className="absolute -top-0.5 -right-0.5 w-7 h-7 border-t-4 border-r-4 border-[#22d3ee] rounded-tr-xl" />
            <div className="absolute -bottom-0.5 -left-0.5 w-7 h-7 border-b-4 border-l-4 border-[#22d3ee] rounded-bl-xl" />
            <div className="absolute -bottom-0.5 -right-0.5 w-7 h-7 border-b-4 border-r-4 border-[#22d3ee] rounded-br-xl" />

            {/* Glowing Laser Sweep Animation */}
            <div className="w-full h-1 bg-gradient-to-r from-transparent via-[#22d3ee] to-transparent shadow-[0_0_12px_#22d3ee] animate-laser" />
          </div>
        </div>

        {/* Fallback / Camera Denied Message */}
        {scannerError && (
          <div className="absolute inset-0 bg-slate-950/95 flex flex-col items-center justify-center p-6 text-center text-white z-10">
            <div className="w-12 h-12 rounded-full bg-rose-500/20 text-rose-400 flex items-center justify-center mb-3">
              <CameraOff className="w-6 h-6" />
            </div>
            <p className="text-sm font-bold text-slate-100 mb-1">Camera Not Detected</p>
            <p className="text-xs text-slate-400 max-w-xs mb-4 leading-relaxed">{scannerError}</p>
            <button
              onClick={startCamera}
              className="px-4 py-2 bg-[#00838f] hover:bg-[#006d77] text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition shadow-md shadow-teal-900/40"
            >
              <RefreshCcw className="w-3.5 h-3.5" />
              <span>Retry Camera Permission</span>
            </button>
          </div>
        )}
      </div>

      <p className="text-xs font-semibold text-slate-500 mt-3 text-center">
        Point camera at visitor badge QR or 2D barcode for 5-second capture
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
                  <span className={`text-[9px] font-black uppercase px-1.5 py-0.2 rounded ${
                    b.tag === 'VIP' ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-600'
                  }`}>
                    {b.tag}
                  </span>
                </div>
                <p className="text-[11px] text-slate-500">{b.role} • {b.company}</p>
              </div>
              <span className="text-[10px] font-mono font-bold text-teal-700 bg-teal-50 px-2 py-0.5 rounded border border-teal-200">
                Tap Scan
              </span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
