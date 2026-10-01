'use client';

import React, { useState, useEffect } from 'react';
import { Download, Share2, PlusSquare, X, Smartphone, Sparkles, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/Button';

// Global reference so any page/button can trigger install
let globalDeferredPrompt: any = null;
const installListeners = new Set<(canInstall: boolean) => void>();

export function triggerGlobalPwaInstall(onShowIosModal?: () => void) {
  if (globalDeferredPrompt) {
    globalDeferredPrompt.prompt();
    globalDeferredPrompt.userChoice.then(() => {
      globalDeferredPrompt = null;
      installListeners.forEach((l) => l(false));
    });
  } else if (onShowIosModal) {
    onShowIosModal();
  }
}

export function PwaInstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isStandalone, setIsStandalone] = useState(false);
  const [isIos, setIsIos] = useState(false);
  const [showBanner, setShowBanner] = useState(false);
  const [showIosModal, setShowIosModal] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    // Check if running in standalone mode (already installed)
    const isStandaloneMode =
      window.matchMedia('(display-mode: standalone)').matches ||
      (window.navigator as any).standalone === true ||
      document.referrer.includes('android-app://');

    setIsStandalone(isStandaloneMode);
    if (isStandaloneMode) return;

    // Detect iOS
    const userAgent = window.navigator.userAgent.toLowerCase();
    const isIosDevice = /iphone|ipad|ipod/.test(userAgent);
    setIsIos(isIosDevice);

    // Check if dismissed previously in this session
    const wasDismissed = sessionStorage.getItem('pwa_install_banner_dismissed') === 'true';
    setDismissed(wasDismissed);

    // Handler for Chrome / Android beforeinstallprompt
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
      globalDeferredPrompt = e;
      installListeners.forEach((l) => l(true));
      if (!wasDismissed) {
        setShowBanner(true);
      }
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    // On iOS Safari, show prompt after brief delay if not standalone and not dismissed
    if (isIosDevice && !isStandaloneMode && !wasDismissed) {
      const timer = setTimeout(() => {
        setShowBanner(true);
      }, 1500);
      return () => clearTimeout(timer);
    }

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstallClick = () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      deferredPrompt.userChoice.then((choiceResult: any) => {
        if (choiceResult.outcome === 'accepted') {
          console.log('[PWA] User accepted the install prompt');
          setShowBanner(false);
        }
        setDeferredPrompt(null);
        globalDeferredPrompt = null;
        installListeners.forEach((l) => l(false));
      });
    } else if (isIos) {
      setShowIosModal(true);
    } else {
      // General instructions for mobile Chrome/Firefox
      alert('To install lead2b: Tap your browser menu (⋮) and select "Install app" or "Add to Home Screen".');
    }
  };

  const handleDismiss = () => {
    setShowBanner(false);
    setDismissed(true);
    if (typeof window !== 'undefined') {
      sessionStorage.setItem('pwa_install_banner_dismissed', 'true');
    }
  };

  // If already running inside installed standalone app, do not show banner
  if (isStandalone || dismissed || !showBanner) return null;

  return (
    <>
      {/* Sleek Floating Install Banner */}
      <div className="fixed top-2 left-3 right-3 z-50 animate-in slide-in-from-top-4 duration-300 max-w-md mx-auto">
        <div className="p-3 bg-gradient-to-r from-slate-950 via-slate-900 to-[#005f69] text-white rounded-2xl shadow-2xl border border-teal-500/40 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-10 h-10 rounded-xl bg-white text-brand-700 flex items-center justify-center font-black text-sm shrink-0 shadow-sm p-1.5">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/icons/icon-192x192.png" alt="lead2b" className="w-full h-full object-contain" />
            </div>
            <div className="min-w-0">
              <h4 className="text-xs font-black text-white leading-tight flex items-center gap-1.5 truncate">
                <span>Install lead2b Mobile App</span>
                <span className="text-[9px] font-black uppercase px-1.5 py-0.2 rounded bg-cyan-400 text-slate-950">
                  Fast
                </span>
              </h4>
              <p className="text-[10px] text-slate-300 mt-0.5 truncate font-medium">
                100% offline badge & card capture at your booth
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            <button
              onClick={handleInstallClick}
              className="px-3 py-1.5 rounded-xl bg-gradient-to-r from-cyan-400 to-teal-400 text-slate-950 font-black text-xs shadow-md hover:brightness-105 active:scale-95 transition flex items-center gap-1 cursor-pointer"
            >
              <Download className="w-3.5 h-3.5 stroke-[2.5]" />
              <span>Install</span>
            </button>
            <button
              onClick={handleDismiss}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white transition cursor-pointer"
              title="Dismiss"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* iOS Safari Step-by-Step Instructions Modal */}
      {showIosModal && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-in fade-in-50">
          <div className="w-full max-w-sm bg-white rounded-3xl p-5 shadow-2xl border border-slate-200 text-slate-900 space-y-4 animate-in slide-in-from-bottom-6">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-teal-50 text-[#00838f] flex items-center justify-center font-bold">
                  <Smartphone className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-black text-slate-900">Install on iPhone / iPad</h3>
                  <p className="text-[10px] text-slate-500 font-medium">2 easy steps to add to your Home Screen</p>
                </div>
              </div>
              <button
                onClick={() => setShowIosModal(false)}
                className="p-1 rounded-full text-slate-400 hover:text-slate-600"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="flex items-start gap-3 p-3 rounded-2xl bg-slate-50 border border-slate-100">
                <div className="w-7 h-7 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0 font-bold">
                  <Share2 className="w-4 h-4" />
                </div>
                <div>
                  <p className="font-bold text-slate-900">1. Tap the Share button</p>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    Look for the Share icon <span className="font-bold text-blue-600">[ ↑ ]</span> in the bottom toolbar of Safari.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3 p-3 rounded-2xl bg-slate-50 border border-slate-100">
                <div className="w-7 h-7 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0 font-bold">
                  <PlusSquare className="w-4 h-4" />
                </div>
                <div>
                  <p className="font-bold text-slate-900">2. Tap &ldquo;Add to Home Screen&rdquo;</p>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    Scroll down the share sheet and tap <strong>Add to Home Screen</strong>, then tap <strong>Add</strong> in the top right corner.
                  </p>
                </div>
              </div>
            </div>

            <div className="pt-1">
              <Button
                variant="primary"
                size="sm"
                onClick={() => {
                  setShowIosModal(false);
                  setShowBanner(false);
                }}
                className="w-full font-bold text-xs"
              >
                Got It, Thank You
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
