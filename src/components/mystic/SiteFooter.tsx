import { forwardRef } from 'react';
import { Link } from 'react-router-dom';
import { Shield, CreditCard } from 'lucide-react';
import { cn } from '@/lib/utils';

interface SiteFooterProps {
  className?: string;
}

/**
 * Footer du site avec liens légaux et mention paiement
 */
export const SiteFooter = forwardRef<HTMLElement, SiteFooterProps>(
  ({ className }, ref) => {
    const currentYear = new Date().getFullYear();

    const legalLinks = [
      { href: '/legal/terms', label: 'CGV' },
      { href: '/legal/privacy', label: 'Confidentialité' },
      { href: '/legal/imprint', label: 'Mentions légales' },
      { href: '/disclaimer', label: 'Avertissement' },
    ];

    return (
      <footer
        ref={ref}
        className={cn(
          'relative z-10',
          'border-t border-mp-surface-border',
          'bg-mp-bg-900/50 backdrop-blur-sm',
          className
        )}
      >
        <div className="container mx-auto px-4 py-8">
          <div className="flex flex-col items-center gap-6">
            {/* Pricing & Security badges */}
            <div className="flex flex-wrap justify-center gap-4">
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-full mp-glass border border-mp-surface-border">
                <CreditCard className="h-4 w-4" style={{ color: 'hsl(var(--mp-brand-gold))' }} />
                <span className="text-xs text-white/90">3,90€/mois · Sans engagement</span>
              </div>
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-full mp-glass border border-mp-surface-border">
                <Shield className="h-4 w-4" style={{ color: 'hsl(var(--mp-brand-gold))' }} />
                <span className="text-xs text-white/90">Paiement sécurisé Stripe</span>
              </div>
            </div>

            {/* Liens légaux */}
            <nav className="flex flex-wrap justify-center gap-4 md:gap-6">
              {legalLinks.map((link) => (
                <Link
                  key={link.href}
                  to={link.href}
                  className={cn(
                    'text-sm transition-colors duration-200',
                    'text-white/80 hover:text-mp-brand-gold',
                    'focus:outline-none focus-visible:underline'
                  )}
                >
                  {link.label}
                </Link>
              ))}
            </nav>

            {/* Copyright */}
            <div className="text-center">
              <p className="text-xs text-white/75">
                © {currentYear} VLM Consulting · L'Oeil du Tarot. Tous droits réservés.
              </p>
              <p className="mt-1 text-xs text-white/60">
                Plateforme de guidance réalisée par une synthèse de tarologues certifiés
              </p>
            </div>
          </div>
        </div>
      </footer>
    );
  }
);

SiteFooter.displayName = 'SiteFooter';

export default SiteFooter;
