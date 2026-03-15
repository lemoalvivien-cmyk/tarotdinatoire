import { ReactNode } from 'react';
import { Header } from './Header';
import { Footer } from './Footer';
import { PWAInstallPrompt } from '@/components/pwa/PWAInstallPrompt';
import { StarfieldCanvas } from '@/components/mystic/StarfieldCanvas';

interface LayoutProps {
  children: ReactNode;
  showFooter?: boolean;
}

export function Layout({ children, showFooter = true }: LayoutProps) {
  return (
    <div className="min-h-screen flex flex-col relative">
      {/* WCAG 2.2: Skip to main content link */}
      <a
        href="#main-content"
        className="skip-link sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-[9999] focus:px-4 focus:py-2 focus:rounded-lg focus:font-semibold focus:text-foreground"
        style={{ background: 'hsl(var(--mp-brand-gold))', color: 'hsl(var(--mp-bg-900))' }}
      >
        Aller au contenu principal
      </a>

      {/* Starfield — always behind everything via z-index: -1 */}
      <StarfieldCanvas />

      {/* Mist overlay at bottom — behind content */}
      <div
        className="fixed bottom-0 left-0 right-0 h-64 mist-overlay pointer-events-none"
        style={{ zIndex: 0 }}
        aria-hidden="true"
      />

      <Header />

      <main id="main-content" className="flex-1 relative" tabIndex={-1}>
        {children}
      </main>

      {showFooter && <Footer />}

      {/* PWA Install Banner */}
      <PWAInstallPrompt />
    </div>
  );
}
