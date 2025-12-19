import { Layout } from '@/components/layout/Layout';
import { SEOHead } from '@/components/seo/SEOHead';
import { Building2, Mail, FileText, Globe } from 'lucide-react';

export default function Imprint() {
  return (
    <Layout>
      <SEOHead
        title="Mentions Légales | Tarot Divinatoire"
        description="Mentions légales du service Tarot Divinatoire. Éditeur, hébergement et propriété intellectuelle."
        noindex={true}
      />
      <div className="container mx-auto px-4 py-16">
        <div className="max-w-3xl mx-auto">
          <div className="text-center mb-12">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 text-primary mb-6">
              <Building2 className="h-8 w-8" />
            </div>
            <h1 className="font-serif text-3xl md:text-4xl font-semibold mb-4">
              Mentions Légales
            </h1>
            <p className="text-muted-foreground">
              Conformément à l'article 6 de la loi n° 2004-575 du 21 juin 2004 pour la confiance dans l'économie numérique
            </p>
          </div>

          <div className="space-y-8">
            {/* Éditeur */}
            <section className="p-6 rounded-xl bg-card border border-border/50">
              <div className="flex items-start gap-4">
                <FileText className="h-5 w-5 text-primary mt-1" />
                <div className="flex-1 space-y-3">
                  <h2 className="font-serif text-xl font-semibold">1. Éditeur du site</h2>
                  <div className="space-y-2 text-muted-foreground">
                    <p><strong>Nom :</strong> Vivien Le Moal</p>
                    <p><strong>Statut :</strong> Auto-entrepreneur (conseil en gestion / NAF 7022Z)</p>
                    <p><strong>SIRET :</strong> 83512508900028</p>
                    <p><strong>Adresse de correspondance :</strong> 59170 Croix, France</p>
                  </div>
                </div>
              </div>
            </section>

            {/* Directeur de publication */}
            <section className="p-6 rounded-xl bg-card border border-border/50">
              <div className="flex items-start gap-4">
                <Globe className="h-5 w-5 text-primary mt-1" />
                <div className="flex-1 space-y-3">
                  <h2 className="font-serif text-xl font-semibold">2. Directeur de la publication</h2>
                  <p className="text-muted-foreground">Vivien Le Moal</p>
                </div>
              </div>
            </section>

            {/* Contact */}
            <section className="p-6 rounded-xl bg-card border border-border/50">
              <div className="flex items-start gap-4">
                <Mail className="h-5 w-5 text-primary mt-1" />
                <div className="flex-1 space-y-3">
                  <h2 className="font-serif text-xl font-semibold">3. Contact</h2>
                  <p className="text-muted-foreground">
                    Pour toute question relative à ce site, vous pouvez nous contacter par email à :{' '}
                    <a href="mailto:contact@ton-domaine.fr" className="text-primary hover:underline">
                      contact@ton-domaine.fr
                    </a>
                    {' '}[À COMPLÉTER]
                  </p>
                </div>
              </div>
            </section>

            {/* Hébergement */}
            <section className="p-6 rounded-xl bg-card border border-border/50">
              <h2 className="font-serif text-xl font-semibold mb-4">4. Hébergement</h2>
              <div className="space-y-2 text-muted-foreground">
                <p><strong>Hébergeur :</strong> Lovable Cloud</p>
                <p><strong>Infrastructure :</strong> Cloud sécurisée avec chiffrement en transit et au repos</p>
                <p className="text-sm italic">[À COMPLÉTER : adresse et coordonnées complètes de l'hébergeur]</p>
              </div>
            </section>

            {/* Propriété intellectuelle */}
            <section className="p-6 rounded-xl bg-card border border-border/50">
              <h2 className="font-serif text-xl font-semibold mb-4">5. Propriété intellectuelle</h2>
              <div className="space-y-3 text-muted-foreground">
                <p>
                  L'ensemble du contenu présent sur ce site (textes, images, illustrations, graphismes, 
                  logos, icônes, sons, logiciels, structure du site) est protégé par le droit d'auteur 
                  et les lois relatives à la propriété intellectuelle.
                </p>
                <p>
                  Toute reproduction, représentation, modification, publication, adaptation totale ou 
                  partielle de ces éléments, quel que soit le moyen ou le procédé utilisé, est interdite 
                  sans l'autorisation écrite préalable de l'éditeur.
                </p>
                <p>
                  Les illustrations des arcanes du Tarot sont inspirées des traditions ésotériques et 
                  adaptées spécifiquement pour Tarot Divinatoire.
                </p>
              </div>
            </section>

            {/* Crédits */}
            <section className="p-6 rounded-xl bg-card border border-border/50">
              <h2 className="font-serif text-xl font-semibold mb-4">6. Crédits</h2>
              <div className="space-y-2 text-muted-foreground">
                <p><strong>Conception et développement :</strong> Tarot Divinatoire</p>
                <p><strong>Expertise tarotique :</strong> Collectif de plus de 30 tarologues professionnels</p>
                <p><strong>Interprétations assistées par :</strong> Intelligence artificielle Lovable AI</p>
              </div>
            </section>

            {/* Liens utiles */}
            <section className="p-6 rounded-xl bg-muted/50 border border-border/30">
              <h2 className="font-serif text-lg font-semibold mb-3">Liens utiles</h2>
              <div className="flex flex-wrap gap-3">
                <a href="/legal/privacy" className="text-primary hover:underline text-sm">
                  Politique de confidentialité
                </a>
                <span className="text-border">•</span>
                <a href="/legal/terms" className="text-primary hover:underline text-sm">
                  Conditions générales
                </a>
                <span className="text-border">•</span>
                <a href="/legal/cookies" className="text-primary hover:underline text-sm">
                  Politique cookies
                </a>
                <span className="text-border">•</span>
                <a href="/legal/rights" className="text-primary hover:underline text-sm">
                  Exercer mes droits
                </a>
              </div>
            </section>
          </div>
        </div>
      </div>
    </Layout>
  );
}
