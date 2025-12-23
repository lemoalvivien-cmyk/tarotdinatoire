import { forwardRef } from 'react';
import { Link } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { BetaBadge } from './BetaBadge';

interface SiteFooterProps {
  className?: string;
}

/**
 * Footer du site avec liens légaux et mention bêta
 */
export const SiteFooter = forwardRef<HTMLElement, SiteFooterProps>(
  ({ className }, ref) => {
    const currentYear = new Date().getFullYear();

    const legalLinks = [
      { href: '/legal/terms', label: 'CGU' },
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
            {/* Beta Badge */}
            <BetaBadge />

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
                © {currentYear} Tarot Divinatoire. Tous droits réservés.
              </p>
              <p className="mt-1 text-xs text-white/60">
                Service de guidance spirituelle — ne remplace pas un avis professionnel
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
