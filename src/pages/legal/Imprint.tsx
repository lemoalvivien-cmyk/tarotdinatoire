import { Layout } from '@/components/layout/Layout';
import { SEOHead } from '@/components/seo/SEOHead';
import { Building2, Scale, Globe, Server, Lock, Brain, FileText, Link2, Clock, Shield, Gavel, RefreshCw, ImageIcon } from 'lucide-react';

export default function Imprint() {
  const currentDate = new Date().toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' });
  
  return (
    <Layout>
      <SEOHead
        title="Mentions Légales | Tarot Dinatoire"
        description="Mentions légales du service Tarot Dinatoire. Éditeur, hébergement, propriété intellectuelle et conditions d'utilisation."
        noindex={true}
      />
      <div className="container mx-auto px-4 py-16">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="text-center mb-12">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 text-primary mb-6">
              <Scale className="h-8 w-8" />
            </div>
            <h1 className="font-serif text-3xl md:text-4xl font-semibold mb-4">
              Mentions Légales
            </h1>
            <p className="text-muted-foreground">
              Conformément à la loi n° 2004-575 du 21 juin 2004 pour la confiance dans l'économie numérique
            </p>
          </div>

          <div className="space-y-8">
            {/* Préambule */}
            <section className="p-6 rounded-xl bg-card border border-border/50">
              <div className="flex items-start gap-4">
                <FileText className="h-5 w-5 text-primary mt-1 shrink-0" />
                <div className="flex-1 space-y-3">
                  <h2 className="font-serif text-xl font-semibold">1. Préambule</h2>
                  <p className="text-muted-foreground leading-relaxed">
                    Les présentes mentions légales régissent l'utilisation du site <strong>tarotdivinatoire.app</strong> (ci-après « le Site ») 
                    édité par Vivien Le Moal. En accédant au Site, l'utilisateur reconnaît avoir pris connaissance des présentes mentions 
                    et s'engage à les respecter.
                  </p>
                </div>
              </div>
            </section>

            {/* Lexique */}
            <section className="p-6 rounded-xl bg-card border border-border/50">
              <div className="flex items-start gap-4">
                <FileText className="h-5 w-5 text-primary mt-1 shrink-0" />
                <div className="flex-1 space-y-3">
                  <h2 className="font-serif text-xl font-semibold">2. Lexique</h2>
                  <ul className="text-muted-foreground space-y-2 list-disc list-inside">
                    <li><strong>Éditeur :</strong> personne physique ou morale responsable de la publication du Site.</li>
                    <li><strong>Utilisateur :</strong> toute personne naviguant sur le Site ou utilisant ses services.</li>
                    <li><strong>Service :</strong> ensemble des fonctionnalités proposées par le Site, notamment les tirages de tarot et interprétations.</li>
                    <li><strong>Contenu :</strong> textes, images, illustrations, vidéos, données et tout élément publié sur le Site.</li>
                  </ul>
                </div>
              </div>
            </section>

            {/* Identification de l'éditeur */}
            <section className="p-6 rounded-xl bg-card border border-border/50">
              <div className="flex items-start gap-4">
                <Building2 className="h-5 w-5 text-primary mt-1 shrink-0" />
                <div className="flex-1 space-y-3">
                  <h2 className="font-serif text-xl font-semibold">3. Identification de l'éditeur</h2>
                  <div className="space-y-2 text-muted-foreground">
                    <p><strong>Responsable de la publication :</strong> Vivien Le Moal</p>
                    <p><strong>Statut :</strong> Auto-entrepreneur (activité : conseil en gestion / NAF 7022Z)</p>
                    <p><strong>SIRET :</strong> 83512508900028</p>
                    <p><strong>Adresse de correspondance :</strong> 59170 Croix, France</p>
                    <p><strong>Directeur de la publication :</strong> Vivien Le Moal</p>
                    <p>
                      <strong>Contact :</strong>{' '}
                      <a href="mailto:contact@tarotdivinatoire.app" className="text-primary hover:underline">
                        contact@tarotdivinatoire.app
                      </a>
                    </p>
                  </div>
                </div>
              </div>
            </section>

            {/* Hébergeur */}
            <section className="p-6 rounded-xl bg-card border border-border/50">
              <div className="flex items-start gap-4">
                <Server className="h-5 w-5 text-primary mt-1 shrink-0" />
                <div className="flex-1 space-y-3">
                  <h2 className="font-serif text-xl font-semibold">4. Hébergeur</h2>
                   <div className="space-y-2 text-muted-foreground">
                    <p><strong>Hébergeur :</strong> Supabase Inc.</p>
                    <p><strong>Adresse :</strong> 970 Toa Payoh North #07-04, Singapore 318992</p>
                    <p><strong>Site web :</strong>{' '}
                      <a href="https://supabase.com" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">supabase.com</a>
                    </p>
                    <p className="text-sm italic">
                      L'infrastructure technique assure un chiffrement en transit (TLS) et au repos des données.
                    </p>
                  </div>
                </div>
              </div>
            </section>

            {/* Accès au Site */}
            <section className="p-6 rounded-xl bg-card border border-border/50">
              <div className="flex items-start gap-4">
                <Globe className="h-5 w-5 text-primary mt-1 shrink-0" />
                <div className="flex-1 space-y-3">
                  <h2 className="font-serif text-xl font-semibold">5. Accès au Site</h2>
                  <div className="space-y-3 text-muted-foreground">
                    <p>
                      Le Site est accessible à tout utilisateur disposant d'un accès à Internet. 
                      L'utilisation complète des services (tirages, historique, etc.) nécessite un abonnement 
                      Premium à 3,90€ TTC par mois.
                    </p>
                    <p>
                      Tous les frais relatifs à l'accès au Site (matériel informatique, logiciels, connexion Internet, etc.) 
                      sont à la charge exclusive de l'utilisateur.
                    </p>
                    <p>
                      L'utilisateur est responsable de la confidentialité de ses identifiants de connexion.
                    </p>
                  </div>
                </div>
              </div>
            </section>

            {/* Âge minimum */}
            <section className="p-6 rounded-xl bg-card border border-border/50">
              <div className="flex items-start gap-4">
                <Lock className="h-5 w-5 text-primary mt-1 shrink-0" />
                <div className="flex-1 space-y-3">
                  <h2 className="font-serif text-xl font-semibold">6. Âge minimum</h2>
                  <p className="text-muted-foreground leading-relaxed">
                    Le Site et ses services sont destinés aux personnes âgées de <strong>18 ans minimum</strong>. 
                    En créant un compte ou en utilisant les services, l'utilisateur déclare être majeur. 
                    Les mineurs souhaitant utiliser le Site doivent obtenir l'autorisation préalable de leur représentant légal.
                  </p>
                </div>
              </div>
            </section>

            {/* Avertissement - Nature du service */}
            <section className="p-6 rounded-xl bg-amber-500/10 border border-amber-500/30">
              <div className="flex items-start gap-4">
                <Shield className="h-5 w-5 text-amber-600 mt-1 shrink-0" />
                <div className="flex-1 space-y-3">
                  <h2 className="font-serif text-xl font-semibold text-amber-700 dark:text-amber-400">7. Avertissement – Nature du service</h2>
                  <div className="space-y-3 text-muted-foreground">
                    <p>
                      <strong>Le tarot divinatoire proposé sur ce Site est un outil d'introspection et de réflexion personnelle.</strong> 
                      Les tirages et interprétations fournis n'ont aucune valeur prédictive certaine et ne constituent en aucun cas :
                    </p>
                    <ul className="list-disc list-inside space-y-1 ml-2">
                      <li>Un avis médical, psychologique ou thérapeutique</li>
                      <li>Un conseil juridique, financier ou professionnel</li>
                      <li>Une prédiction garantie de l'avenir</li>
                    </ul>
                    <p>
                      L'utilisateur reste seul responsable des décisions qu'il prend suite à l'utilisation du Service. 
                      En cas de difficultés personnelles, il est vivement conseillé de consulter un professionnel qualifié.
                    </p>
                  </div>
                </div>
              </div>
            </section>

            {/* Technologie et expertise */}
            <section className="p-6 rounded-xl bg-card border border-border/50">
              <div className="flex items-start gap-4">
                <Brain className="h-5 w-5 text-primary mt-1 shrink-0" />
                <div className="flex-1 space-y-3">
                  <h2 className="font-serif text-xl font-semibold">8. Technologie et expertise</h2>
                  <div className="space-y-3 text-muted-foreground">
                    <p>
                      Les interprétations des tirages sont réalisées grâce à une synthèse du savoir-faire 
                      de plus de 30 tarologues professionnels, assistée par des outils technologiques avancés.
                    </p>
                    <p>
                      Ces interprétations sont fournies à titre indicatif et peuvent contenir des inexactitudes. 
                      L'éditeur ne saurait être tenu responsable des erreurs ou omissions dans les contenus produits.
                    </p>
                  </div>
                </div>
              </div>
            </section>

            {/* Propriété intellectuelle */}
            <section className="p-6 rounded-xl bg-card border border-border/50">
              <div className="flex items-start gap-4">
                <FileText className="h-5 w-5 text-primary mt-1 shrink-0" />
                <div className="flex-1 space-y-3">
                  <h2 className="font-serif text-xl font-semibold">9. Propriété intellectuelle</h2>
                  <div className="space-y-3 text-muted-foreground">
                    <p>
                      L'ensemble du contenu présent sur ce Site (textes, images, illustrations, graphismes, logos, icônes, 
                      sons, logiciels, structure du site) est protégé par le droit d'auteur et les lois relatives à la propriété intellectuelle.
                    </p>
                    <p>
                      Toute reproduction, représentation, modification, publication, adaptation totale ou partielle de ces éléments, 
                      quel que soit le moyen ou le procédé utilisé, est <strong>interdite sans l'autorisation écrite préalable</strong> de l'éditeur.
                    </p>
                  </div>
                </div>
              </div>
            </section>

            {/* Crédits images */}
            <section className="p-6 rounded-xl bg-card border border-border/50">
              <div className="flex items-start gap-4">
                <ImageIcon className="h-5 w-5 text-primary mt-1 shrink-0" />
                <div className="flex-1 space-y-3">
                  <h2 className="font-serif text-xl font-semibold">10. Crédits images</h2>
                  <div className="space-y-3 text-muted-foreground">
                    <p>
                      Les illustrations des 78 arcanes du Tarot utilisées sur ce site proviennent du <strong>CBD Tarot de Marseille</strong>, 
                      créé par <strong>Yoav Ben-Dov</strong> (1957-2016), tarologue et auteur israélien reconnu.
                    </p>
                    <p>
                      Ces images sont diffusées sous licence open source et utilisées dans le respect des conditions de cette licence. 
                      Le deck original est disponible sur{' '}
                      <a 
                        href="https://www.cbdtarot.com" 
                        target="_blank" 
                        rel="noopener noreferrer" 
                        className="text-primary hover:underline"
                      >
                        cbdtarot.com
                      </a>.
                    </p>
                    <p className="text-sm italic">
                      Nous rendons hommage au travail de Yoav Ben-Dov et à sa contribution majeure à la préservation 
                      et à la diffusion du Tarot de Marseille historique.
                    </p>
                  </div>
                </div>
              </div>
            </section>

            {/* Liens externes */}
            <section className="p-6 rounded-xl bg-card border border-border/50">
              <div className="flex items-start gap-4">
                <Link2 className="h-5 w-5 text-primary mt-1 shrink-0" />
                <div className="flex-1 space-y-3">
                  <h2 className="font-serif text-xl font-semibold">11. Liens externes</h2>
                  <p className="text-muted-foreground leading-relaxed">
                    Le Site peut contenir des liens hypertextes vers d'autres sites. L'éditeur n'exerce aucun contrôle 
                    sur ces sites et décline toute responsabilité quant à leur contenu, leur politique de confidentialité 
                    ou leurs pratiques. L'utilisateur navigue sur ces sites externes à ses propres risques.
                  </p>
                </div>
              </div>
            </section>

            {/* Disponibilité */}
            <section className="p-6 rounded-xl bg-card border border-border/50">
              <div className="flex items-start gap-4">
                <Clock className="h-5 w-5 text-primary mt-1 shrink-0" />
                <div className="flex-1 space-y-3">
                  <h2 className="font-serif text-xl font-semibold">12. Disponibilité du Site</h2>
                  <div className="space-y-3 text-muted-foreground">
                    <p>
                      L'éditeur s'efforce de maintenir le Site accessible 24h/24 et 7j/7. Toutefois, l'accès peut être 
                      temporairement suspendu pour des raisons de maintenance, de mise à jour ou pour toute autre raison 
                      technique indépendante de la volonté de l'éditeur.
                    </p>
                    <p>
                      L'éditeur ne saurait être tenu responsable des interruptions de service, des pertes de données 
                      ou des dommages résultant de l'indisponibilité du Site.
                    </p>
                  </div>
                </div>
              </div>
            </section>

            {/* Données personnelles & Cookies */}
            <section className="p-6 rounded-xl bg-card border border-border/50">
              <div className="flex items-start gap-4">
                <Shield className="h-5 w-5 text-primary mt-1 shrink-0" />
                <div className="flex-1 space-y-3">
                  <h2 className="font-serif text-xl font-semibold">13. Données personnelles & Cookies</h2>
                  <div className="space-y-3 text-muted-foreground">
                    <p>
                      La collecte et le traitement des données personnelles sont régis par notre{' '}
                      <a href="/legal/privacy" className="text-primary hover:underline">Politique de confidentialité</a>.
                    </p>
                    <p>
                      L'utilisation des cookies est détaillée dans notre{' '}
                      <a href="/legal/cookies" className="text-primary hover:underline">Politique cookies</a>.
                    </p>
                    <p>
                      Conformément au RGPD, l'utilisateur dispose de droits sur ses données (accès, rectification, suppression, portabilité). 
                      Ces droits peuvent être exercés via la page{' '}
                      <a href="/legal/rights" className="text-primary hover:underline">Exercer mes droits</a>.
                    </p>
                  </div>
                </div>
              </div>
            </section>

            {/* Droit applicable */}
            <section className="p-6 rounded-xl bg-card border border-border/50">
              <div className="flex items-start gap-4">
                <Gavel className="h-5 w-5 text-primary mt-1 shrink-0" />
                <div className="flex-1 space-y-3">
                  <h2 className="font-serif text-xl font-semibold">14. Droit applicable & Juridiction</h2>
                  <div className="space-y-3 text-muted-foreground">
                    <p>
                      Les présentes mentions légales sont soumises au <strong>droit français</strong>.
                    </p>
                    <p>
                      En cas de litige, et après échec d'une tentative de résolution amiable, les tribunaux français 
                      seront seuls compétents pour connaître du différend.
                    </p>
                    <p>
                      Conformément à l'article L.612-1 du Code de la consommation, l'utilisateur peut recourir gratuitement 
                      à un médiateur de la consommation en vue de la résolution amiable d'un litige.
                    </p>
                  </div>
                </div>
              </div>
            </section>

            {/* Mise à jour */}
            <section className="p-6 rounded-xl bg-muted/50 border border-border/30">
              <div className="flex items-start gap-4">
                <RefreshCw className="h-5 w-5 text-primary mt-1 shrink-0" />
                <div className="flex-1 space-y-3">
                  <h2 className="font-serif text-xl font-semibold">15. Mise à jour des mentions légales</h2>
                  <p className="text-muted-foreground leading-relaxed">
                    Les présentes mentions légales peuvent être modifiées à tout moment. L'utilisateur est invité à les consulter 
                    régulièrement. La date de dernière mise à jour est indiquée ci-dessous.
                  </p>
                  <p className="text-sm font-medium">
                    Dernière mise à jour : {currentDate}
                  </p>
                </div>
              </div>
            </section>

            {/* Liens utiles */}
            <section className="p-6 rounded-xl bg-primary/5 border border-primary/20">
              <h2 className="font-serif text-lg font-semibold mb-4">Liens utiles</h2>
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
                <span className="text-border">•</span>
                <a href="/disclaimer" className="text-primary hover:underline text-sm">
                  Avertissement
                </a>
              </div>
            </section>
          </div>
        </div>
      </div>
    </Layout>
  );
}
