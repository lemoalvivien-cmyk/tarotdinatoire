import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Download, X, Smartphone } from 'lucide-react';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

export function PWAInstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [showPrompt, setShowPrompt] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [showIOSGuide, setShowIOSGuide] = useState(false);

  useEffect(() => {
    // Check if iOS
    const isIOSDevice = /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as unknown as { MSStream?: unknown }).MSStream;
    setIsIOS(isIOSDevice);

    // Check if already installed
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches;
    if (isStandalone) return;

    // Check if dismissed recently
    const dismissed = localStorage.getItem('pwa-install-dismissed');
    if (dismissed) {
      const dismissedAt = parseInt(dismissed, 10);
      const daysSinceDismissed = (Date.now() - dismissedAt) / (1000 * 60 * 60 * 24);
      if (daysSinceDismissed < 7) return;
    }

    // Listen for install prompt
    const handleBeforeInstall = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      // Show prompt after a delay
      setTimeout(() => setShowPrompt(true), 5000);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstall);

    // For iOS, show prompt after delay
    if (isIOSDevice && !isStandalone) {
      setTimeout(() => setShowPrompt(true), 10000);
    }

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstall);
    };
  }, []);

  const handleInstall = async () => {
    if (isIOS) {
      setShowIOSGuide(true);
      return;
    }

    if (!deferredPrompt) return;

    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    
    if (outcome === 'accepted') {
      setShowPrompt(false);
    }
    setDeferredPrompt(null);
  };

  const handleDismiss = () => {
    setShowPrompt(false);
    setShowIOSGuide(false);
    localStorage.setItem('pwa-install-dismissed', Date.now().toString());
  };

  if (!showPrompt) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ y: 100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 100, opacity: 0 }}
        className="fixed bottom-20 left-4 right-4 md:left-auto md:right-4 md:w-80 z-40"
      >
        <div className="bg-card/95 backdrop-blur-xl border border-border/50 rounded-xl shadow-2xl p-4">
          {showIOSGuide ? (
            // iOS Installation Guide
            <div className="space-y-3">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-2">
                  <Smartphone className="h-5 w-5 text-primary" />
                  <span className="font-medium text-sm">Installer sur iOS</span>
                </div>
                <button onClick={handleDismiss} className="text-muted-foreground hover:text-foreground">
                  <X className="h-4 w-4" />
                </button>
              </div>
              <ol className="text-xs text-muted-foreground space-y-2 list-decimal list-inside">
                <li>Appuyez sur le bouton <strong>Partager</strong> (icône carré avec flèche)</li>
                <li>Faites défiler et appuyez sur <strong>"Sur l'écran d'accueil"</strong></li>
                <li>Appuyez sur <strong>Ajouter</strong></li>
              </ol>
            </div>
          ) : (
            // Standard Prompt
            <div className="flex items-start gap-3">
              <div className="p-2 rounded-lg bg-primary/10 text-primary flex-shrink-0">
                <Download className="h-5 w-5" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-medium text-sm">Installer l'application</p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Accédez rapidement à Tarot Divinatoire depuis votre écran d'accueil
                </p>
                <div className="flex gap-2 mt-3">
                  <Button size="sm" onClick={handleInstall} className="h-8 text-xs">
                    Installer
                  </Button>
                  <Button size="sm" variant="ghost" onClick={handleDismiss} className="h-8 text-xs">
                    Plus tard
                  </Button>
                </div>
              </div>
              <button onClick={handleDismiss} className="text-muted-foreground hover:text-foreground">
                <X className="h-4 w-4" />
              </button>
            </div>
          )}
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
