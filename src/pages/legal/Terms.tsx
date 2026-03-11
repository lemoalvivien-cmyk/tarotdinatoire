import { Layout } from '@/components/layout/Layout';
import { Link } from 'react-router-dom';
import { SEOHead } from '@/components/seo/SEOHead';
import { FileText, AlertTriangle, Scale, UserCheck, Ban, Shield, CreditCard, Euro } from 'lucide-react';

export default function Terms() {
  return (
    <Layout>
      <SEOHead
        title="Conditions Générales de Vente (CGV) | Tarot Dinatoire"
        description="CGV du service Tarot Dinatoire. Abonnement mensuel à 3,90€ TTC. Service de guidance et introspection - pas de conseils médicaux, juridiques ou financiers."
        noindex={true}
      />
      <div className="container mx-auto px-4 py-16">
        <div className="max-w-3xl mx-auto">
          {/* Header */}
          <div className="text-center mb-12">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 text-primary mb-6">
              <FileText className="h-8 w-8" />
            </div>
            <h1 className="font-serif text-3xl md:text-4xl font-semibold mb-4">
              Conditions Générales de Vente
            </h1>
            <p className="text-muted-foreground">
              Dernière mise à jour : {new Date().toLocaleDateString('fr-FR')}
            </p>
          </div>

          <div className="space-y-8">
            {/* Tarification */}
            <section className="p-6 rounded-xl bg-primary/5 border border-primary/20">
              <div className="flex items-start gap-4">
                <Euro className="h-5 w-5 text-primary mt-1" />
                <div>
                  <h2 className="font-serif text-xl font-semibold mb-2">Abonnement Premium</h2>
                  <div className="space-y-3 text-muted-foreground">
                    <p className="text-2xl font-bold text-foreground">
                      3,90€ <span className="text-sm font-normal">TTC / mois</span>
                    </p>
                    <ul className="list-disc list-inside space-y-1">
                      <li>Tirages illimités 24/7</li>
                      <li>Interprétations approfondies par IA</li>
                      <li>Accès à tous les spreads</li>
                      <li>Historique complet sauvegardé</li>
                      <li>Favoris et export PDF</li>
                    </ul>
                    <p className="text-sm">
                      Sans engagement · Annulation en 1 clic à tout moment
                    </p>
                  </div>
                </div>
              </div>
            </section>

            {/* Paiement */}
            <section className="p-6 rounded-xl bg-card border border-border/50">
              <div className="flex items-start gap-4">
                <CreditCard className="h-5 w-5 text-primary mt-1" />
                <div className="flex-1">
                  <h2 className="font-serif text-xl font-semibold mb-4">1. Modalités de paiement</h2>
                  <div className="space-y-4 text-muted-foreground">
                    <p>
                      Le paiement s'effectue par carte bancaire via notre prestataire sécurisé 
                      <strong> Stripe</strong> (certifié PCI-DSS).
                    </p>
                    <p>
                      Le premier paiement est effectué lors de la souscription, puis 
                      automatiquement renouvelé chaque mois à date anniversaire.
                    </p>
                    <p>
                      <strong>VLM Consulting ne stocke JAMAIS vos données bancaires complètes.</strong>
                    </p>
                  </div>
                </div>
              </div>
            </section>

            {/* Droit de rétractation */}
            <section className="p-6 rounded-xl bg-card border border-border/50">
              <div className="flex items-start gap-4">
                <Shield className="h-5 w-5 text-primary mt-1" />
                <div className="flex-1">
                  <h2 className="font-serif text-xl font-semibold mb-4">2. Droit de rétractation</h2>
                  <div className="space-y-4 text-muted-foreground">
                    <p>
                      Conformément à l'article L221-28 du Code de la consommation, vous disposez 
                      d'un délai de <strong>14 jours</strong> à compter de la souscription pour 
                      exercer votre droit de rétractation sans avoir à justifier de motif.
                    </p>
                    <p>Pour exercer ce droit :</p>
                    <ul className="list-disc list-inside space-y-1">
                      <li>Email : contact@tarotdivinatoire.app</li>
                      <li>Ou depuis votre profil → "Gérer mon abonnement" → "Annuler"</li>
                    </ul>
                    <p className="font-medium">
                      En cas de rétractation dans les 14 jours, le montant sera intégralement 
                      remboursé sous 14 jours ouvrés.
                    </p>
                  </div>
                </div>
              </div>
            </section>

            {/* Résiliation */}
            <section className="p-6 rounded-xl bg-card border border-border/50">
              <h2 className="font-serif text-xl font-semibold mb-4">3. Résiliation</h2>
              <div className="space-y-4 text-muted-foreground">
                <p>
                  L'abonné peut résilier son abonnement à tout moment depuis son profil 
                  utilisateur ou en contactant le support.
                </p>
                <p>
                  La résiliation prend effet à la fin de la période d'abonnement en cours 
                  (pas de remboursement au prorata, sauf droit de rétractation de 14 jours).
                </p>
              </div>
            </section>

            {/* Objet */}
            <section className="p-6 rounded-xl bg-card border border-border/50">
              <h2 className="font-serif text-xl font-semibold mb-4">4. Objet du service</h2>
              <p className="text-muted-foreground">
                Les présentes Conditions Générales de Vente (CGV) régissent l'abonnement au 
                service de Tarot Divinatoire en ligne proposé par VLM Consulting. 
                L'inscription et l'utilisation du service impliquent l'acceptation pleine 
                et entière de ces CGV.
              </p>
            </section>

            {/* Description du service */}
            <section className="p-6 rounded-xl bg-card border border-border/50">
              <h2 className="font-serif text-xl font-semibold mb-4">5. Description du service</h2>
              <div className="space-y-4 text-muted-foreground">
                <p>
                  Tarot Divinatoire est une plateforme de tirage de tarot assistée par 
                  intelligence artificielle, conçue exclusivement pour l'introspection 
                  personnelle et la guidance spirituelle.
                </p>
                <p>Le service Premium comprend :</p>
                <ul className="list-disc list-inside space-y-1">
                  <li>Différents types de tirages de tarot (1 à plusieurs cartes)</li>
                  <li>Interprétations générées par IA, validées par un collectif de tarologues</li>
                  <li>Historique personnel des tirages</li>
                  <li>Possibilité de sauvegarder des tirages en favoris</li>
                  <li>Notes personnelles sur les tirages</li>
                  <li>Export PDF des interprétations</li>
                </ul>
              </div>
            </section>

            {/* Limitation de responsabilité */}
            <section className="p-6 rounded-xl bg-destructive/5 border border-destructive/20">
              <div className="flex items-start gap-4">
                <AlertTriangle className="h-5 w-5 text-destructive mt-1 flex-shrink-0" />
                <div>
                  <h2 className="font-serif text-xl font-semibold mb-4 text-destructive">
                    6. Limitation de responsabilité - IMPORTANT
                  </h2>
                  <div className="space-y-4 text-muted-foreground">
                    <p className="font-medium text-foreground">
                      Les interprétations fournies par Tarot Divinatoire ne constituent EN AUCUN CAS :
                    </p>
                    <ul className="list-disc list-inside space-y-2">
                      <li><strong>Des conseils médicaux</strong> — Consultez un professionnel de santé</li>
                      <li><strong>Des conseils juridiques</strong> — Consultez un avocat ou juriste</li>
                      <li><strong>Des conseils financiers</strong> — Consultez un conseiller financier agréé</li>
                      <li><strong>Des prédictions certaines</strong> — Le tarot est un outil de réflexion, pas de divination</li>
                      <li><strong>Des conseils psychologiques</strong> — Consultez un psychologue ou psychiatre</li>
                    </ul>
                    <p className="text-sm font-medium">
                      L'utilisateur reste seul responsable des décisions qu'il prend dans sa vie. 
                      Tarot Divinatoire décline toute responsabilité quant aux conséquences de 
                      l'interprétation des tirages.
                    </p>
                  </div>
                </div>
              </div>
            </section>

            {/* Inscription */}
            <section className="p-6 rounded-xl bg-card border border-border/50">
              <div className="flex items-start gap-4">
                <UserCheck className="h-5 w-5 text-primary mt-1" />
                <div className="flex-1">
                  <h2 className="font-serif text-xl font-semibold mb-4">7. Inscription et compte</h2>
                  <div className="space-y-4 text-muted-foreground">
                    <p>
                      L'utilisation du service nécessite la création d'un compte avec une 
                      adresse email valide et un abonnement actif. L'utilisateur s'engage à :
                    </p>
                    <ul className="list-disc list-inside space-y-1">
                      <li>Fournir des informations exactes et à jour</li>
                      <li>Maintenir la confidentialité de ses identifiants</li>
                      <li>Notifier immédiatement toute utilisation non autorisée</li>
                      <li>Ne pas créer plusieurs comptes</li>
                    </ul>
                    <p>
                      Vous devez avoir au moins 18 ans pour utiliser ce service, ou avoir 
                      l'autorisation d'un représentant légal.
                    </p>
                  </div>
                </div>
              </div>
            </section>

            {/* Comportements interdits */}
            <section className="p-6 rounded-xl bg-card border border-border/50">
              <div className="flex items-start gap-4">
                <Ban className="h-5 w-5 text-destructive mt-1" />
                <div className="flex-1">
                  <h2 className="font-serif text-xl font-semibold mb-4">8. Comportements interdits</h2>
                  <div className="space-y-4 text-muted-foreground">
                    <p>Il est interdit de :</p>
                    <ul className="list-disc list-inside space-y-1">
                      <li>Utiliser le service à des fins illégales</li>
                      <li>Tenter de contourner les mesures de sécurité</li>
                      <li>Exploiter le service de manière automatisée (bots, scripts)</li>
                      <li>Revendre ou redistribuer le contenu sans autorisation</li>
                      <li>Perturber le fonctionnement du service</li>
                      <li>Usurper l'identité d'un autre utilisateur</li>
                    </ul>
                    <p className="text-sm">
                      Tout manquement peut entraîner la suspension ou suppression du compte 
                      sans préavis ni remboursement.
                    </p>
                  </div>
                </div>
              </div>
            </section>

            {/* Propriété intellectuelle */}
            <section className="p-6 rounded-xl bg-card border border-border/50">
              <h2 className="font-serif text-xl font-semibold mb-4">9. Propriété intellectuelle</h2>
              <div className="space-y-4 text-muted-foreground">
                <p>
                  L'ensemble du contenu du site (textes, images, illustrations, logiciels, 
                  interprétations) est protégé par le droit d'auteur et appartient à 
                  VLM Consulting ou à ses partenaires.
                </p>
                <p>
                  L'utilisateur dispose d'un droit d'usage personnel et non commercial 
                  de ses propres tirages et interprétations.
                </p>
              </div>
            </section>

            {/* Disponibilité */}
            <section className="p-6 rounded-xl bg-card border border-border/50">
              <h2 className="font-serif text-xl font-semibold mb-4">10. Disponibilité du service</h2>
              <div className="space-y-4 text-muted-foreground">
                <p>
                  VLM Consulting s'engage à fournir un service accessible 24/7. Toutefois, 
                  des interruptions temporaires peuvent survenir pour maintenance 
                  (planifiée ou d'urgence).
                </p>
                <p>
                  Aucun remboursement ne sera effectué pour des interruptions de moins 
                  de 24h consécutives. En cas d'interruption prolongée, nous vous 
                  informerons via la page{' '}
                  <Link to="/status" className="text-primary hover:underline">État du service</Link>.
                </p>
              </div>
            </section>

            {/* Données personnelles */}
            <section className="p-6 rounded-xl bg-card border border-border/50">
              <h2 className="font-serif text-xl font-semibold mb-4">11. Données personnelles</h2>
              <p className="text-muted-foreground">
                Le traitement de vos données personnelles est régi par notre{' '}
                <Link to="/legal/privacy" className="text-primary hover:underline">
                  Politique de Confidentialité
                </Link>
                . En utilisant le service, vous acceptez cette politique.
              </p>
            </section>

            {/* Modification */}
            <section className="p-6 rounded-xl bg-card border border-border/50">
              <h2 className="font-serif text-xl font-semibold mb-4">12. Modification des CGV</h2>
              <p className="text-muted-foreground">
                VLM Consulting se réserve le droit de modifier les présentes CGV. 
                Les utilisateurs seront informés par email 30 jours avant toute 
                modification substantielle (notamment tarifaire). La poursuite de 
                l'utilisation du service vaut acceptation des nouvelles CGV.
              </p>
            </section>

            {/* Droit applicable */}
            <section className="p-6 rounded-xl bg-card border border-border/50">
              <div className="flex items-start gap-4">
                <Scale className="h-5 w-5 text-primary mt-1" />
                <div className="flex-1">
                  <h2 className="font-serif text-xl font-semibold mb-4">13. Droit applicable et litiges</h2>
                  <div className="space-y-4 text-muted-foreground">
                    <p>
                      Les présentes CGV sont régies par le droit français. En cas de litige, 
                      une solution amiable sera recherchée avant toute action judiciaire.
                    </p>
                    <p>
                      Conformément à l'article L. 612-1 du Code de la consommation, vous pouvez 
                      recourir à un médiateur de la consommation en vue de la 
                      résolution amiable d'un litige.
                    </p>
                    <p>
                      À défaut d'accord amiable, les tribunaux de Lille, France seront seuls compétents.
                    </p>
                  </div>
                </div>
              </div>
            </section>

            {/* Contact */}
            <section className="p-6 rounded-xl bg-muted/50 border border-border/30">
              <h2 className="font-serif text-lg font-semibold mb-3">Contact</h2>
              <p className="text-sm text-muted-foreground">
                Pour toute question concernant ces CGV : <strong>contact@tarotdivinatoire.app</strong>
                <br />
                Voir également nos{' '}
                <Link to="/legal/imprint" className="text-primary hover:underline">
                  mentions légales
                </Link>.
              </p>
            </section>
          </div>
        </div>
      </div>
    </Layout>
  );
}
