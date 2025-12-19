import { Layout } from '@/components/layout/Layout';
import { Link } from 'react-router-dom';
import { SEOHead } from '@/components/seo/SEOHead';
import { Cookie, Shield, BarChart3, Megaphone, Settings, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useCookieConsent } from '@/hooks/useCookieConsent';

export default function CookiesPolicy() {
  const { resetConsent } = useCookieConsent();

  return (
    <Layout>
      <SEOHead
        title="Politique des Cookies | Tarot Divinatoire"
        description="Politique des cookies de Tarot Divinatoire. Comprendre quels cookies nous utilisons, pourquoi, et comment gérer vos préférences."
        noindex={true}
      />
      <div className="container mx-auto px-4 py-16">
        <div className="max-w-3xl mx-auto">
          {/* Header */}
          <div className="text-center mb-12">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 text-primary mb-6">
              <Cookie className="h-8 w-8" />
            </div>
            <h1 className="font-serif text-3xl md:text-4xl font-semibold mb-4">
              Politique des Cookies
            </h1>
            <p className="text-muted-foreground">
              Dernière mise à jour : {new Date().toLocaleDateString('fr-FR')}
            </p>
          </div>

          <div className="space-y-8">
            {/* Qu'est-ce qu'un cookie */}
            <section className="p-6 rounded-xl bg-card border border-border/50">
              <h2 className="font-serif text-xl font-semibold mb-4">Qu'est-ce qu'un cookie ?</h2>
              <p className="text-muted-foreground">
                Un cookie est un petit fichier texte déposé sur votre appareil (ordinateur, 
                tablette, smartphone) lors de votre visite sur un site web. Il permet au site 
                de mémoriser des informations sur votre visite, comme votre langue préférée 
                ou vos préférences de connexion, facilitant ainsi vos visites suivantes et 
                rendant le site plus utile.
              </p>
            </section>

            {/* Types de cookies */}
            <section className="p-6 rounded-xl bg-card border border-border/50">
              <h2 className="font-serif text-xl font-semibold mb-6">Types de cookies utilisés</h2>
              
              <div className="space-y-6">
                {/* Essentiels */}
                <div className="p-4 rounded-lg bg-emerald-500/10 border border-emerald-500/30">
                  <div className="flex items-start gap-4">
                    <Shield className="h-5 w-5 text-emerald-500 mt-1" />
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <h3 className="font-medium">Cookies essentiels</h3>
                        <span className="px-2 py-0.5 rounded text-xs bg-emerald-500/20 text-emerald-600">
                          Toujours actifs
                        </span>
                      </div>
                      <p className="text-sm text-muted-foreground mb-3">
                        Ces cookies sont indispensables au fonctionnement du site. Sans eux, 
                        vous ne pourriez pas naviguer ni utiliser les fonctionnalités de base.
                      </p>
                      <div className="text-sm">
                        <p className="font-medium mb-1">Exemples :</p>
                        <ul className="list-disc list-inside text-muted-foreground space-y-1">
                          <li>Authentification et maintien de votre session</li>
                          <li>Mémorisation de vos préférences de consentement</li>
                          <li>Sécurité et protection contre la fraude</li>
                        </ul>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Analytiques */}
                <div className="p-4 rounded-lg bg-blue-500/10 border border-blue-500/30">
                  <div className="flex items-start gap-4">
                    <BarChart3 className="h-5 w-5 text-blue-500 mt-1" />
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <h3 className="font-medium">Cookies analytiques</h3>
                        <span className="px-2 py-0.5 rounded text-xs bg-blue-500/20 text-blue-600">
                          Opt-in requis
                        </span>
                      </div>
                      <p className="text-sm text-muted-foreground mb-3">
                        Ces cookies nous permettent de comprendre comment vous utilisez le site 
                        pour l'améliorer. Ils collectent des informations anonymisées sur les 
                        pages visitées, les fonctionnalités utilisées, et les erreurs rencontrées.
                      </p>
                      <div className="text-sm">
                        <p className="font-medium mb-1">Données collectées :</p>
                        <ul className="list-disc list-inside text-muted-foreground space-y-1">
                          <li>Pages visitées et temps passé</li>
                          <li>Actions effectuées (tirages, navigation)</li>
                          <li>Type d'appareil et navigateur (anonymisé)</li>
                        </ul>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Marketing */}
                <div className="p-4 rounded-lg bg-orange-500/10 border border-orange-500/30">
                  <div className="flex items-start gap-4">
                    <Megaphone className="h-5 w-5 text-orange-500 mt-1" />
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <h3 className="font-medium">Cookies marketing</h3>
                        <span className="px-2 py-0.5 rounded text-xs bg-orange-500/20 text-orange-600">
                          Opt-in requis
                        </span>
                      </div>
                      <p className="text-sm text-muted-foreground mb-3">
                        Ces cookies sont utilisés pour vous proposer des contenus et publicités 
                        personnalisés. Ils peuvent être déposés par des partenaires publicitaires.
                      </p>
                      <p className="text-sm text-muted-foreground italic">
                        Note : Actuellement, Tarot Divinatoire n'utilise pas de cookies marketing. 
                        Cette catégorie est prévue pour de futures fonctionnalités.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </section>

            {/* Durées de conservation */}
            <section className="p-6 rounded-xl bg-card border border-border/50">
              <div className="flex items-start gap-4">
                <Clock className="h-5 w-5 text-primary mt-1" />
                <div className="flex-1">
                  <h2 className="font-serif text-xl font-semibold mb-4">Durées de conservation</h2>
                  <div className="space-y-3 text-muted-foreground">
                    <p><strong>Cookies de session :</strong> Supprimés à la fermeture du navigateur</p>
                    <p><strong>Cookies d'authentification :</strong> 30 jours maximum</p>
                    <p><strong>Cookies de préférences :</strong> 13 mois maximum</p>
                    <p><strong>Cookies analytiques :</strong> 13 mois maximum</p>
                    <p className="text-sm italic">
                      Conformément aux recommandations de la CNIL, nous respectons la durée 
                      maximale de 13 mois pour le stockage des données de consentement.
                    </p>
                  </div>
                </div>
              </div>
            </section>

            {/* Gestion des cookies */}
            <section className="p-6 rounded-xl bg-primary/5 border border-primary/20">
              <div className="flex items-start gap-4">
                <Settings className="h-5 w-5 text-primary mt-1" />
                <div className="flex-1">
                  <h2 className="font-serif text-xl font-semibold mb-4">Gérer vos préférences</h2>
                  <p className="text-muted-foreground mb-4">
                    Vous pouvez à tout moment modifier vos préférences de cookies :
                  </p>
                  <Button 
                    onClick={resetConsent}
                    variant="default"
                    className="mb-4"
                  >
                    Modifier mes préférences cookies
                  </Button>
                  <p className="text-sm text-muted-foreground">
                    Vous pouvez également configurer votre navigateur pour refuser tous les cookies 
                    ou être alerté lorsqu'un cookie est envoyé. Cependant, certaines fonctionnalités 
                    du site pourraient ne plus fonctionner correctement.
                  </p>
                </div>
              </div>
            </section>

            {/* Configuration navigateur */}
            <section className="p-6 rounded-xl bg-card border border-border/50">
              <h2 className="font-serif text-xl font-semibold mb-4">Configuration du navigateur</h2>
              <p className="text-muted-foreground mb-4">
                Vous pouvez configurer votre navigateur pour gérer les cookies :
              </p>
              <ul className="space-y-2 text-muted-foreground">
                <li>
                  <strong>Chrome :</strong>{' '}
                  <a 
                    href="https://support.google.com/chrome/answer/95647" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-primary hover:underline"
                  >
                    Paramètres des cookies
                  </a>
                </li>
                <li>
                  <strong>Firefox :</strong>{' '}
                  <a 
                    href="https://support.mozilla.org/fr/kb/protection-renforcee-contre-pistage-firefox-bureau" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-primary hover:underline"
                  >
                    Protection contre le pistage
                  </a>
                </li>
                <li>
                  <strong>Safari :</strong>{' '}
                  <a 
                    href="https://support.apple.com/fr-fr/guide/safari/sfri11471/mac" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-primary hover:underline"
                  >
                    Gestion des cookies
                  </a>
                </li>
                <li>
                  <strong>Edge :</strong>{' '}
                  <a 
                    href="https://support.microsoft.com/fr-fr/microsoft-edge/supprimer-les-cookies-dans-microsoft-edge-63947406-40ac-c3b8-57b9-2a946a29ae09" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-primary hover:underline"
                  >
                    Supprimer les cookies
                  </a>
                </li>
              </ul>
            </section>

            {/* Journalisation du consentement */}
            <section className="p-6 rounded-xl bg-card border border-border/50">
              <h2 className="font-serif text-xl font-semibold mb-4">Journalisation du consentement</h2>
              <p className="text-muted-foreground">
                Conformément au RGPD, nous conservons une trace de votre consentement cookies 
                (acceptation, refus, ou personnalisation). Ces logs sont conservés pendant 
                13 mois et permettent de prouver que votre consentement a été recueilli 
                de manière conforme. Vous pouvez retrouver vos préférences dans votre profil.
              </p>
            </section>

            {/* Liens utiles */}
            <section className="p-6 rounded-xl bg-muted/50 border border-border/30">
              <h2 className="font-serif text-lg font-semibold mb-3">Liens utiles</h2>
              <div className="flex flex-wrap gap-3">
                <Link to="/legal/privacy" className="text-primary hover:underline text-sm">
                  Politique de confidentialité
                </Link>
                <span className="text-border">•</span>
                <Link to="/legal/terms" className="text-primary hover:underline text-sm">
                  Conditions générales
                </Link>
                <span className="text-border">•</span>
                <a 
                  href="https://www.cnil.fr/fr/cookies-et-autres-traceurs" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-primary hover:underline text-sm"
                >
                  CNIL - Cookies et traceurs
                </a>
              </div>
            </section>
          </div>
        </div>
      </div>
    </Layout>
  );
}
