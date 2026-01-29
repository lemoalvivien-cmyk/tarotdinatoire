import { Layout } from '@/components/layout/Layout';
import { Link } from 'react-router-dom';
import { SEOHead } from '@/components/seo/SEOHead';
import { Shield, Database, Lock, Globe, Clock, Users, Mail } from 'lucide-react';

export default function Privacy() {
  return (
    <Layout>
      <SEOHead
        title="Politique de Confidentialité | Tarot Divinatoire"
        description="Politique de confidentialité et protection des données personnelles. RGPD compliant. Vos droits : accès, rectification, effacement, portabilité."
        noindex={true}
      />
      <div className="container mx-auto px-4 py-16">
        <div className="max-w-3xl mx-auto">
          {/* Header */}
          <div className="text-center mb-12">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 text-primary mb-6">
              <Shield className="h-8 w-8" />
            </div>
            <h1 className="font-serif text-3xl md:text-4xl font-semibold mb-4">
              Politique de Confidentialité
            </h1>
            <p className="text-muted-foreground">
              Dernière mise à jour : {new Date().toLocaleDateString('fr-FR')}
            </p>
          </div>

          <div className="space-y-8">
            {/* Introduction */}
            <section className="p-6 rounded-xl bg-card border border-border/50">
              <h2 className="font-serif text-xl font-semibold mb-4">Engagement de protection</h2>
              <p className="text-muted-foreground">
                Tarot Divinatoire s'engage à protéger votre vie privée et vos données personnelles 
                conformément au Règlement Général sur la Protection des Données (RGPD) et à la loi 
                Informatique et Libertés. Cette politique vous informe de la manière dont nous 
                collectons, utilisons et protégeons vos informations lors de votre utilisation de 
                notre plateforme de guidance spirituelle.
              </p>
            </section>

            {/* Responsable du traitement */}
            <section className="p-6 rounded-xl bg-card border border-border/50">
              <div className="flex items-start gap-4">
                <Users className="h-5 w-5 text-primary mt-1" />
                <div className="flex-1">
                  <h2 className="font-serif text-xl font-semibold mb-4">1. Responsable du traitement</h2>
                  <div className="space-y-2 text-muted-foreground">
                    <p><strong>Responsable :</strong> Vivien Le Moal</p>
                    <p><strong>Statut :</strong> Auto-entrepreneur (conseil / NAF 7022Z)</p>
                    <p><strong>SIRET :</strong> 83512508900028</p>
                    <p><strong>Adresse :</strong> 59170 Croix, France</p>
                    <p>
                      <strong>Contact RGPD :</strong>{' '}
                      <a href="mailto:contact@vlmconsulting.fr" className="text-primary hover:underline">
                        contact@vlmconsulting.fr
                      </a>
                    </p>
                  </div>
                </div>
              </div>
            </section>

            {/* Données collectées */}
            <section className="p-6 rounded-xl bg-card border border-border/50">
              <div className="flex items-start gap-4">
                <Database className="h-5 w-5 text-primary mt-1" />
                <div className="flex-1">
                  <h2 className="font-serif text-xl font-semibold mb-4">2. Données collectées</h2>
                  
                  <div className="space-y-4 text-muted-foreground">
                    <div>
                      <h3 className="font-medium text-foreground mb-2">Compte utilisateur</h3>
                      <ul className="list-disc list-inside space-y-1">
                        <li>Adresse email (pour l'authentification)</li>
                        <li>Mot de passe (haché de manière sécurisée, jamais stocké en clair)</li>
                        <li>Identifiant unique utilisateur</li>
                        <li>Dates de création et dernière connexion</li>
                      </ul>
                    </div>
                    
                    <div>
                      <h3 className="font-medium text-foreground mb-2">Profil utilisateur</h3>
                      <ul className="list-disc list-inside space-y-1">
                        <li>Nom d'affichage (optionnel)</li>
                        <li>Intention spirituelle déclarée</li>
                        <li>Domaine de guidance préféré</li>
                        <li>Statut d'onboarding</li>
                      </ul>
                    </div>
                    
                    <div>
                      <h3 className="font-medium text-foreground mb-2">Sessions de tirage</h3>
                      <ul className="list-disc list-inside space-y-1">
                        <li>Type de tirage choisi</li>
                        <li>Question posée (optionnelle)</li>
                        <li>Cartes tirées et leur interprétation</li>
                        <li>Notes personnelles ajoutées</li>
                        <li>Date et heure du tirage</li>
                      </ul>
                    </div>
                    
                    <div>
                      <h3 className="font-medium text-foreground mb-2">Consentements</h3>
                      <ul className="list-disc list-inside space-y-1">
                        <li>Préférences cookies (essentiel, analytique, marketing)</li>
                        <li>Consentement email marketing (si applicable)</li>
                        <li>Horodatage des consentements</li>
                      </ul>
                    </div>
                    
                    <div>
                      <h3 className="font-medium text-foreground mb-2">Données techniques</h3>
                      <ul className="list-disc list-inside space-y-1">
                        <li>Adresse IP (pour la sécurité, anonymisée dans les logs)</li>
                        <li>User-agent du navigateur</li>
                        <li>Événements d'utilisation (navigation, clics)</li>
                      </ul>
                    </div>

                    <div>
                      <h3 className="font-medium text-foreground mb-2">Données de paiement (via Stripe)</h3>
                      <ul className="list-disc list-inside space-y-1">
                        <li>Nom sur la carte bancaire</li>
                        <li>4 derniers chiffres de la carte (pour référence)</li>
                        <li>Identifiant client Stripe</li>
                        <li>Statut et dates d'abonnement</li>
                      </ul>
                      <p className="text-sm mt-2 italic">
                        Note : Les données bancaires complètes (numéro de carte, CVV) sont traitées 
                        exclusivement par Stripe et ne sont jamais stockées sur nos serveurs.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </section>

            {/* Finalités et bases légales */}
            <section className="p-6 rounded-xl bg-card border border-border/50">
              <h2 className="font-serif text-xl font-semibold mb-4">3. Finalités et bases légales</h2>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border">
                      <th className="text-left py-3 font-medium">Finalité</th>
                      <th className="text-left py-3 font-medium">Base légale</th>
                    </tr>
                  </thead>
                  <tbody className="text-muted-foreground">
                    <tr className="border-b border-border/50">
                      <td className="py-3">Création et gestion de compte</td>
                      <td className="py-3">Exécution du contrat (CGU)</td>
                    </tr>
                    <tr className="border-b border-border/50">
                      <td className="py-3">Fourniture du service de tirage</td>
                      <td className="py-3">Exécution du contrat</td>
                    </tr>
                    <tr className="border-b border-border/50">
                      <td className="py-3">Gestion des abonnements et paiements</td>
                      <td className="py-3">Exécution du contrat</td>
                    </tr>
                    <tr className="border-b border-border/50">
                      <td className="py-3">Historique des tirages</td>
                      <td className="py-3">Exécution du contrat</td>
                    </tr>
                    <tr className="border-b border-border/50">
                      <td className="py-3">Amélioration du service</td>
                      <td className="py-3">Intérêt légitime</td>
                    </tr>
                    <tr className="border-b border-border/50">
                      <td className="py-3">Communications marketing</td>
                      <td className="py-3">Consentement explicite</td>
                    </tr>
                    <tr className="border-b border-border/50">
                      <td className="py-3">Cookies analytiques</td>
                      <td className="py-3">Consentement</td>
                    </tr>
                    <tr>
                      <td className="py-3">Sécurité et prévention fraude</td>
                      <td className="py-3">Intérêt légitime</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </section>

            {/* Durées de conservation */}
            <section className="p-6 rounded-xl bg-card border border-border/50">
              <div className="flex items-start gap-4">
                <Clock className="h-5 w-5 text-primary mt-1" />
                <div className="flex-1">
                  <h2 className="font-serif text-xl font-semibold mb-4">4. Durées de conservation</h2>
                  <div className="space-y-3 text-muted-foreground">
                    <p><strong>Compte utilisateur :</strong> Tant que le compte est actif, suppression sur demande</p>
                    <p><strong>Profil :</strong> Lié au compte, supprimé avec celui-ci</p>
                    <p><strong>Historique des tirages :</strong> 12 mois par défaut (ou suppression du compte)</p>
                    <p><strong>Logs de consentement cookies :</strong> 13 mois (obligation légale)</p>
                    <p><strong>Logs techniques/sécurité :</strong> 12 mois</p>
                    <p><strong>Données marketing :</strong> 3 ans après le dernier contact, ou jusqu'au désabonnement</p>
                  </div>
                </div>
              </div>
            </section>

            {/* Destinataires */}
            <section className="p-6 rounded-xl bg-card border border-border/50">
              <h2 className="font-serif text-xl font-semibold mb-4">5. Destinataires des données</h2>
              <div className="space-y-4 text-muted-foreground">
                <p>Vos données peuvent être partagées avec :</p>
                <ul className="list-disc list-inside space-y-2">
                  <li>
                    <strong>Lovable Cloud (Supabase) :</strong> Hébergement base de données, 
                    authentification, stockage fichiers. Localisation : UE/US avec clauses contractuelles types.
                  </li>
                  <li>
                    <strong>Stripe Inc. :</strong> Traitement des paiements et gestion des abonnements. 
                    Certification PCI-DSS Level 1. Nous ne stockons jamais vos données bancaires complètes. 
                    Seuls les 4 derniers chiffres de votre carte sont conservés pour référence.{' '}
                    <a 
                      href="https://stripe.com/fr/privacy" 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-primary hover:underline"
                    >
                      Politique de confidentialité Stripe
                    </a>
                  </li>
                  <li>
                    <strong>Lovable AI :</strong> Génération des interprétations de tirage. 
                    Les données sont traitées de manière sécurisée et ne sont pas utilisées pour 
                    entraîner des modèles tiers.
                  </li>
                  <li>
                    <strong>Outils d'analyse :</strong> Uniquement avec votre consentement cookies.
                  </li>
                </ul>
                <p className="text-sm italic">
                  Nous ne vendons jamais vos données personnelles à des tiers.
                </p>
              </div>
            </section>

            {/* Transferts hors UE */}
            <section className="p-6 rounded-xl bg-card border border-border/50">
              <div className="flex items-start gap-4">
                <Globe className="h-5 w-5 text-primary mt-1" />
                <div className="flex-1">
                  <h2 className="font-serif text-xl font-semibold mb-4">6. Transferts hors Union Européenne</h2>
                  <p className="text-muted-foreground">
                    Certains de nos sous-traitants peuvent traiter des données en dehors de l'UE 
                    (notamment aux États-Unis). Ces transferts sont encadrés par des clauses 
                    contractuelles types approuvées par la Commission Européenne, garantissant 
                    un niveau de protection équivalent au RGPD.
                  </p>
                </div>
              </div>
            </section>

            {/* Sécurité */}
            <section className="p-6 rounded-xl bg-card border border-border/50">
              <div className="flex items-start gap-4">
                <Lock className="h-5 w-5 text-primary mt-1" />
                <div className="flex-1">
                  <h2 className="font-serif text-xl font-semibold mb-4">7. Mesures de sécurité</h2>
                  <ul className="list-disc list-inside space-y-2 text-muted-foreground">
                    <li>Chiffrement des données en transit (HTTPS/TLS)</li>
                    <li>Chiffrement des données au repos</li>
                    <li>Authentification sécurisée avec hash des mots de passe</li>
                    <li>Row Level Security (RLS) : chaque utilisateur n'accède qu'à ses propres données</li>
                    <li>Contrôle d'accès administrateur strictement limité</li>
                    <li>Protection contre les mots de passe compromis</li>
                    <li>Journalisation des accès sensibles</li>
                  </ul>
                </div>
              </div>
            </section>

            {/* Vos droits */}
            <section className="p-6 rounded-xl bg-primary/5 border border-primary/20">
              <h2 className="font-serif text-xl font-semibold mb-4">8. Vos droits (RGPD)</h2>
              <p className="text-muted-foreground mb-4">
                Conformément au RGPD, vous disposez des droits suivants :
              </p>
              <ul className="space-y-3 text-muted-foreground">
                <li>
                  <strong className="text-foreground">Droit d'accès :</strong> Obtenir une copie de 
                  vos données personnelles
                </li>
                <li>
                  <strong className="text-foreground">Droit de rectification :</strong> Corriger des 
                  données inexactes ou incomplètes
                </li>
                <li>
                  <strong className="text-foreground">Droit à l'effacement :</strong> Demander la 
                  suppression de vos données
                </li>
                <li>
                  <strong className="text-foreground">Droit à la portabilité :</strong> Recevoir vos 
                  données dans un format structuré (JSON)
                </li>
                <li>
                  <strong className="text-foreground">Droit d'opposition :</strong> Vous opposer au 
                  traitement pour prospection commerciale
                </li>
                <li>
                  <strong className="text-foreground">Droit de limitation :</strong> Restreindre 
                  temporairement le traitement
                </li>
                <li>
                  <strong className="text-foreground">Retrait du consentement :</strong> Retirer votre 
                  consentement à tout moment
                </li>
              </ul>
              <div className="mt-6 flex flex-col sm:flex-row gap-4">
                <Link 
                  to="/app/profile" 
                  className="inline-flex items-center justify-center px-4 py-2 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
                >
                  Exercer mes droits (connecté)
                </Link>
                <Link 
                  to="/legal/rights" 
                  className="inline-flex items-center justify-center px-4 py-2 rounded-lg border border-border hover:bg-muted transition-colors"
                >
                  Exercer mes droits (non connecté)
                </Link>
              </div>
            </section>

            {/* Cookies */}
            <section className="p-6 rounded-xl bg-card border border-border/50">
              <h2 className="font-serif text-xl font-semibold mb-4">9. Cookies</h2>
              <p className="text-muted-foreground mb-4">
                Nous utilisons des cookies pour le fonctionnement du site et, avec votre consentement, 
                pour l'analyse et le marketing. Consultez notre{' '}
                <Link to="/legal/cookies" className="text-primary hover:underline">
                  politique cookies
                </Link>{' '}
                pour plus de détails.
              </p>
            </section>

            {/* Réclamation */}
            <section className="p-6 rounded-xl bg-card border border-border/50">
              <div className="flex items-start gap-4">
                <Mail className="h-5 w-5 text-primary mt-1" />
                <div className="flex-1">
                  <h2 className="font-serif text-xl font-semibold mb-4">10. Réclamation</h2>
                  <p className="text-muted-foreground">
                    Si vous estimez que vos droits ne sont pas respectés, vous pouvez introduire 
                    une réclamation auprès de la Commission Nationale de l'Informatique et des 
                    Libertés (CNIL) :{' '}
                    <a 
                      href="https://www.cnil.fr/fr/plaintes" 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-primary hover:underline"
                    >
                      www.cnil.fr/fr/plaintes
                    </a>
                  </p>
                </div>
              </div>
            </section>

            {/* Mise à jour */}
            <section className="p-6 rounded-xl bg-muted/50 border border-border/30">
              <h2 className="font-serif text-lg font-semibold mb-3">Mise à jour de cette politique</h2>
              <p className="text-sm text-muted-foreground">
                Cette politique peut être modifiée. En cas de changement significatif, 
                nous vous en informerons par email ou via une notification sur le site.
              </p>
            </section>
          </div>
        </div>
      </div>
    </Layout>
  );
}
