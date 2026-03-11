import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { Sparkles, LogOut, User, BookOpen, Menu, X, Star, Home, Download, Flame, Map } from 'lucide-react';
import { useState, useEffect, useCallback } from 'react';
import { cn } from '@/lib/utils';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

function NavLink({
  to,
  children,
  className,
  onClick,
}: {
  to: string;
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
}) {
  const { pathname } = useLocation();
  const isActive = pathname === to || (to !== '/app' && pathname.startsWith(to));

  return (
    <Link
      to={to}
      onClick={onClick}
      className={cn(
        'text-sm font-medium transition-colors flex items-center gap-1',
        isActive
          ? 'text-primary'
          : 'text-muted-foreground hover:text-primary',
        className,
      )}
    >
      {children}
    </Link>
  );
}

export function Header() {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isInstalled, setIsInstalled] = useState(false);

  // Close mobile menu on route change
  useEffect(() => {
    setMobileMenuOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    if (window.matchMedia('(display-mode: standalone)').matches) {
      setIsInstalled(true);
      return;
    }
    const handleBeforeInstall = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };
    const handleAppInstalled = () => {
      setIsInstalled(true);
      setDeferredPrompt(null);
    };
    window.addEventListener('beforeinstallprompt', handleBeforeInstall);
    window.addEventListener('appinstalled', handleAppInstalled);
    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstall);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  const handleInstallClick = useCallback(async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') setIsInstalled(true);
    setDeferredPrompt(null);
  }, [deferredPrompt]);

  const handleSignOut = useCallback(async () => {
    await signOut();
    navigate('/');
  }, [signOut, navigate]);

  const isAppRoute = location.pathname.startsWith('/app');

  return (
    <header className="sticky top-0 z-50 glass-mystic border-b border-border/50">
      <div className="container mx-auto px-4">
        <div className="flex h-16 items-center justify-between gap-4">
          {/* Logo */}
          <Link to={user ? '/app' : '/'} className="flex items-center gap-2 group shrink-0">
            <Sparkles className="h-5 w-5 text-primary transition-transform group-hover:scale-110" />
            <span className="font-serif text-lg sm:text-xl font-semibold text-foreground">
              Tarot Dinatoire
            </span>
          </Link>

          {/* Pricing Badge - Desktop only */}
          <div className="hidden lg:flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/10 border border-primary/20 shrink-0">
            <Sparkles className="h-3 w-3 text-primary" />
            <span className="text-xs font-medium text-primary">3,90€/mois</span>
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-5 flex-1 justify-end">
            {user ? (
              <>
                {isAppRoute && (
                  <>
                    <NavLink to="/app/daily">
                      <Flame className="h-4 w-4" />
                      Rituel
                    </NavLink>
                    <NavLink to="/app">
                      <Home className="h-4 w-4" />
                      Accueil
                    </NavLink>
                    <NavLink to="/app/new">Tirage</NavLink>
                    <NavLink to="/app/history">
                      <BookOpen className="h-4 w-4" />
                      Journal
                    </NavLink>
                    <NavLink to="/app/favorites">
                      <Star className="h-4 w-4" />
                      Favoris
                    </NavLink>
                  </>
                )}
                <NavLink to="/app/journey">
                  <Map className="h-4 w-4" />
                  Voyage
                </NavLink>
                <NavLink to="/app/profile">
                  <User className="h-4 w-4" />
                  Profil
                </NavLink>
                {deferredPrompt && !isInstalled && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleInstallClick}
                    className="text-primary border-primary/30 hover:bg-primary/10 shrink-0"
                  >
                    <Download className="h-4 w-4 mr-1" />
                    Installer
                  </Button>
                )}
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleSignOut}
                  className="text-muted-foreground hover:text-destructive shrink-0"
                >
                  <LogOut className="h-4 w-4 mr-1" />
                  Déconnexion
                </Button>
              </>
            ) : (
              <>
                <NavLink to="/disclaimer">À propos</NavLink>
                <Link to="/auth">
                  <Button variant="default" size="sm" className="btn-mystic">
                    Commencer
                  </Button>
                </Link>
              </>
            )}
          </nav>

          {/* Mobile Menu Button */}
          <button
            className="md:hidden p-2 text-foreground rounded-md hover:bg-muted/50 transition-colors"
            onClick={() => setMobileMenuOpen(v => !v)}
            aria-label="Menu"
            aria-expanded={mobileMenuOpen}
          >
            {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>

        {/* Mobile Menu — slide down */}
        {mobileMenuOpen && (
          <div className="md:hidden py-4 border-t border-border/50 animate-fade-in-up">
            <div className="flex flex-col gap-3">
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/10 border border-primary/20 self-start">
                <Sparkles className="h-3 w-3 text-primary" />
                <span className="text-xs font-medium text-primary">3,90€/mois · Illimité</span>
              </div>

              {user ? (
                <>
                  <NavLink to="/app" onClick={() => setMobileMenuOpen(false)}>
                    <Home className="h-4 w-4" />
                    Accueil
                  </NavLink>
                  <NavLink to="/app/daily" onClick={() => setMobileMenuOpen(false)}>
                    <Flame className="h-4 w-4" />
                    Rituel du jour
                  </NavLink>
                  <NavLink to="/app/new" onClick={() => setMobileMenuOpen(false)}>
                    <Sparkles className="h-4 w-4" />
                    Nouveau tirage
                  </NavLink>
                  <NavLink to="/app/history" onClick={() => setMobileMenuOpen(false)}>
                    <BookOpen className="h-4 w-4" />
                    Journal
                  </NavLink>
                  <NavLink to="/app/favorites" onClick={() => setMobileMenuOpen(false)}>
                    <Star className="h-4 w-4" />
                    Favoris
                  </NavLink>
                  <NavLink to="/app/journey" onClick={() => setMobileMenuOpen(false)}>
                    <Map className="h-4 w-4" />
                    Voyage
                  </NavLink>
                  <NavLink to="/app/profile" onClick={() => setMobileMenuOpen(false)}>
                    <User className="h-4 w-4" />
                    Profil
                  </NavLink>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => { handleSignOut(); setMobileMenuOpen(false); }}
                    className="text-destructive justify-start w-fit"
                  >
                    <LogOut className="h-4 w-4 mr-1" />
                    Déconnexion
                  </Button>
                </>
              ) : (
                <>
                  <NavLink to="/disclaimer" onClick={() => setMobileMenuOpen(false)}>
                    À propos
                  </NavLink>
                  <Link to="/auth" onClick={() => setMobileMenuOpen(false)}>
                    <Button variant="default" size="sm" className="btn-mystic w-full mt-1">
                      Commencer
                    </Button>
                  </Link>
                </>
              )}
            </div>
          </div>
        )}
      </div>
    </header>
  );
}
