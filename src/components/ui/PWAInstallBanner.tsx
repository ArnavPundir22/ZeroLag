import { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Download, X, Smartphone, Monitor, Apple, Globe } from 'lucide-react';

type Platform = 'android-chrome' | 'ios' | 'desktop' | 'unknown';

interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

function detectPlatform(): Platform {
  const ua = navigator.userAgent;
  if (/iPhone|iPad|iPod/.test(ua)) return 'ios';
  if (/Android/.test(ua)) return 'android-chrome';
  if (/Win|Mac|Linux/.test(navigator.platform)) return 'desktop';
  return 'unknown';
}

const STORAGE_KEY = 'zerolag_pwa_banner_dismissed';

export function PWAInstallBanner() {
  const [visible, setVisible] = useState(false);
  const [platform, setPlatform] = useState<Platform>('unknown');
  const [isInstalled, setIsInstalled] = useState(false);
  const deferredPrompt = useRef<BeforeInstallPromptEvent | null>(null);

  useEffect(() => {
    // Already installed as PWA
    if (window.matchMedia('(display-mode: standalone)').matches) {
      setIsInstalled(true);
      return;
    }
    // User already dismissed
    if (localStorage.getItem(STORAGE_KEY)) return;

    setPlatform(detectPlatform());

    const handler = (e: Event) => {
      e.preventDefault();
      deferredPrompt.current = e as BeforeInstallPromptEvent;
      setVisible(true);
    };

    window.addEventListener('beforeinstallprompt', handler);

    // For iOS/desktop where beforeinstallprompt doesn't fire, show after 2s
    const timer = setTimeout(() => {
      if (!deferredPrompt.current) setVisible(true);
    }, 2000);

    return () => {
      window.removeEventListener('beforeinstallprompt', handler);
      clearTimeout(timer);
    };
  }, []);

  const dismiss = () => {
    localStorage.setItem(STORAGE_KEY, '1');
    setVisible(false);
  };

  const install = async () => {
    if (deferredPrompt.current) {
      await deferredPrompt.current.prompt();
      const { outcome } = await deferredPrompt.current.userChoice;
      if (outcome === 'accepted') setVisible(false);
      deferredPrompt.current = null;
    }
    dismiss();
  };

  if (isInstalled) return null;

  const isIOS = platform === 'ios';
  const isAndroid = platform === 'android-chrome';
  const isDesktop = platform === 'desktop';

  return (
    <AnimatePresence>
      {visible && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[9998]"
            onClick={dismiss}
          />

          {/* Panel */}
          <motion.div
            initial={{ opacity: 0, y: 60, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 60, scale: 0.95 }}
            transition={{ type: 'spring', damping: 22, stiffness: 280 }}
            className="fixed bottom-0 left-0 right-0 z-[9999] sm:bottom-6 sm:left-1/2 sm:-translate-x-1/2 sm:max-w-md sm:w-full px-0 sm:px-4"
          >
            <div className="relative overflow-hidden rounded-t-3xl sm:rounded-2xl border border-white/10 shadow-2xl"
              style={{ background: 'linear-gradient(135deg, rgba(99,102,241,0.18) 0%, rgba(3,7,18,0.97) 60%)' }}>
              
              {/* Glow accent */}
              <div className="absolute -top-10 left-1/2 -translate-x-1/2 w-64 h-24 rounded-full bg-indigo-500/30 blur-3xl pointer-events-none" />

              {/* Header */}
              <div className="relative flex items-start gap-4 px-6 pt-6 pb-4">
                <div className="flex-shrink-0 w-14 h-14 rounded-2xl bg-indigo-500/20 border border-indigo-400/30 flex items-center justify-center">
                  <img src="/icon.png" alt="ZeroLag" className="w-9 h-9 rounded-xl" onError={e => (e.currentTarget.style.display = 'none')} />
                  <Download className="w-7 h-7 text-indigo-400 hidden" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-semibold text-indigo-400 uppercase tracking-widest mb-0.5">Install App</p>
                  <h2 className="text-xl font-bold text-white leading-tight">Get ZeroLag</h2>
                  <p className="text-sm text-slate-400 mt-0.5">Offline-first · Instant · No app store needed</p>
                </div>
                <button
                  onClick={dismiss}
                  className="p-1.5 rounded-lg text-slate-500 hover:text-slate-300 hover:bg-white/5 transition-colors"
                  aria-label="Dismiss"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Features strip */}
              <div className="flex gap-2 px-6 pb-4">
                {['⚡ Zero Latency', '📶 Works Offline', '🔔 Push Alerts'].map(f => (
                  <span key={f} className="text-xs bg-white/5 border border-white/8 rounded-full px-3 py-1 text-slate-300 whitespace-nowrap">{f}</span>
                ))}
              </div>

              <div className="px-6 pb-6 space-y-3">
                {/* Primary CTA — native install prompt (Android/Desktop) */}
                {(deferredPrompt.current || isAndroid || isDesktop) && (
                  <button
                    onClick={install}
                    className="w-full flex items-center justify-center gap-2.5 px-5 py-3.5 rounded-xl font-semibold text-white text-base transition-all active:scale-[0.98]"
                    style={{ background: 'linear-gradient(135deg, #6366f1, #8b5cf6)' }}
                  >
                    {isDesktop ? <Monitor className="w-5 h-5" /> : <Smartphone className="w-5 h-5" />}
                    {deferredPrompt.current ? 'Install Now' : isDesktop ? 'Add to Desktop' : 'Install App'}
                  </button>
                )}

                {/* iOS instructions */}
                {isIOS && (
                  <div className="rounded-xl border border-white/10 bg-white/4 p-4 space-y-2">
                    <div className="flex items-center gap-2 text-slate-300 font-semibold text-sm">
                      <Apple className="w-4 h-4" /> Install on iPhone / iPad
                    </div>
                    <ol className="text-sm text-slate-400 space-y-1.5 list-none">
                      <li><span className="text-indigo-400 font-bold">1.</span> Tap the <span className="text-white font-semibold">Share</span> button <span className="text-lg">⎙</span> in Safari</li>
                      <li><span className="text-indigo-400 font-bold">2.</span> Scroll down → tap <span className="text-white font-semibold">"Add to Home Screen"</span></li>
                      <li><span className="text-indigo-400 font-bold">3.</span> Tap <span className="text-white font-semibold">Add</span> — done! ✅</li>
                    </ol>
                  </div>
                )}

                {/* Desktop Chrome hint */}
                {isDesktop && !deferredPrompt.current && (
                  <div className="flex items-center gap-2.5 rounded-xl border border-white/10 bg-white/4 p-3.5 text-sm text-slate-400">
                  <Globe className="w-5 h-5 flex-shrink-0 text-indigo-400" />
                    <span>Click the <span className="text-white font-semibold">⊕ Install</span> icon in the browser address bar</span>
                  </div>
                )}

                {/* Dismiss link */}
                <button
                  onClick={dismiss}
                  className="w-full text-center text-sm text-slate-500 hover:text-slate-400 py-1 transition-colors"
                >
                  Maybe later
                </button>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
