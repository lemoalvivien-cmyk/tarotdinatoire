import { useState, forwardRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { useCookieConsent } from '@/hooks/useCookieConsent';
import { Cookie, Shield, BarChart3, Megaphone, ChevronDown, ChevronUp } from 'lucide-react';
import { Link } from 'react-router-dom';

export const CookieBanner = forwardRef<HTMLDivElement>((_, ref) => {
  const { showBanner, acceptAll, acceptEssential, saveChoices, isLoading } = useCookieConsent();
  const [showDetails, setShowDetails] = useState(false);
  const [analytics, setAnalytics] = useState(false);
  const [marketing, setMarketing] = useState(false);

  if (isLoading || !showBanner) return null;

  const handleSaveCustom = () => {
    saveChoices({ analytics, marketing });
  };

  return (
    <AnimatePresence>
      <motion.div
        ref={ref}
        initial={{ y: 100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 100, opacity: 0 }}
        transition={{ type: 'spring', damping: 25, stiffness: 300 }}
        className="fixed bottom-0 left-0 right-0 z-50 p-4 md:p-6"
      >
        <div className="max-w-4xl mx-auto">
          <div className="relative bg-card/95 backdrop-blur-xl border border-border/50 rounded-2xl shadow-2xl overflow-hidden">
            {/* Decorative gradient */}
            <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-primary/5 pointer-events-none" />

            <div className="relative p-6 space-y-4">
              {/* Header */}
              <div className="flex items-start gap-4">
                <div className="p-3 rounded-xl bg-primary/10 text-primary">
                  <Cookie className="h-6 w-6" />
                </div>
                <div className="flex-1 min-w-0">
                  <h2 className="font-serif text-lg font-semibold text-foreground">
                    Nous respectons votre vie privée
                  </h2>
                  <p className="text-sm text-muted-foreground mt-1">
                    Nous utilisons des cookies pour améliorer votre expérience. Vous pouvez personnaliser vos préférences ci-dessous.
                  </p>
                </div>
              </div>

              {/* Cookie categories - collapsible */}
              <div className="space-y-3">
                <button
                  onClick={() => setShowDetails(!showDetails)}
                  className="flex items-center gap-2 text-sm text-primary hover:text-primary/80 transition-colors"
                >
                  {showDetails ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                  {showDetails ? 'Masquer les détails' : 'Personnaliser mes choix'}
                </button>

                <AnimatePresence>
                  {showDetails && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.2 }}
                      className="overflow-hidden"
                    >
                      <div className="space-y-4 pt-2 pb-4">
                        {/* Essential - always on */}
                        <div className="flex items-center justify-between p-4 rounded-xl bg-secondary/30 border border-border/30">
                          <div className="flex items-center gap-3">
                            <Shield className="h-5 w-5 text-emerald-500" />
                            <div>
                              <Label className="font-medium">Cookies essentiels</Label>
                              <p className="text-xs text-muted-foreground">Requis pour le fonctionnement du site</p>
                            </div>
                          </div>
                          <Switch checked disabled className="data-[state=checked]:bg-emerald-500" />
                        </div>

                        {/* Analytics */}
                        <div className="flex items-center justify-between p-4 rounded-xl bg-secondary/30 border border-border/30">
                          <div className="flex items-center gap-3">
                            <BarChart3 className="h-5 w-5 text-blue-500" />
                            <div>
                              <Label htmlFor="analytics" className="font-medium cursor-pointer">
                                Cookies analytiques
                              </Label>
                              <p className="text-xs text-muted-foreground">Nous aident à améliorer le site</p>
                            </div>
                          </div>
                          <Switch
                            id="analytics"
                            checked={analytics}
                            onCheckedChange={setAnalytics}
                          />
                        </div>

                        {/* Marketing */}
                        <div className="flex items-center justify-between p-4 rounded-xl bg-secondary/30 border border-border/30">
                          <div className="flex items-center gap-3">
                            <Megaphone className="h-5 w-5 text-orange-500" />
                            <div>
                              <Label htmlFor="marketing" className="font-medium cursor-pointer">
                                Cookies marketing
                              </Label>
                              <p className="text-xs text-muted-foreground">Pour des publicités personnalisées</p>
                            </div>
                          </div>
                          <Switch
                            id="marketing"
                            checked={marketing}
                            onCheckedChange={setMarketing}
                          />
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Actions */}
              <div className="flex flex-col sm:flex-row gap-3">
                {showDetails ? (
                  <Button onClick={handleSaveCustom} className="btn-mystic flex-1">
                    Sauvegarder mes préférences
                  </Button>
                ) : (
                  <>
                    <Button onClick={acceptAll} className="btn-mystic flex-1">
                      Tout accepter
                    </Button>
                    <Button onClick={acceptEssential} variant="outline" className="flex-1">
                      Essentiels uniquement
                    </Button>
                  </>
                )}
              </div>

              {/* Privacy link */}
              <p className="text-xs text-center text-muted-foreground">
                En savoir plus dans notre{' '}
                <Link to="/legal/privacy" className="text-primary hover:underline">
                  politique de confidentialité
                </Link>
              </p>
            </div>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
});

CookieBanner.displayName = 'CookieBanner';
