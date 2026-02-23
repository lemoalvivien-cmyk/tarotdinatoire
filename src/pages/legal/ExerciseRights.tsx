import { Layout } from '@/components/layout/Layout';
import { Link } from 'react-router-dom';
import { SEOHead } from '@/components/seo/SEOHead';
import { UserCheck, Mail, Clock, FileText, Download, Trash2, Edit, Ban, Shield } from 'lucide-react';

export default function ExerciseRights() {
  return (
    <Layout>
      <SEOHead
        title="Exercer mes droits RGPD | Tarot Divinatoire"
        description="Exercez vos droits RGPD : accès, rectification, effacement, portabilité, opposition. Délai de réponse : 1 mois."
        noindex={true}
      />
      <div className="container mx-auto px-4 py-16">
        <div className="max-w-3xl mx-auto">
          {/* Header */}
          <div className="text-center mb-12">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 text-primary mb-6">
              <UserCheck className="h-8 w-8" />
            </div>
            <h1 className="font-serif text-3xl md:text-4xl font-semibold mb-4">
              Exercer mes droits
            </h1>
            <p className="text-muted-foreground max-w-xl mx-auto">
              Conformément au RGPD, vous disposez de droits sur vos données personnelles. 
              Cette page vous explique comment les exercer.
            </p>
          </div>

          <div className="space-y-8">
            {/* Si vous êtes connecté */}
            <section className="p-6 rounded-xl bg-primary/5 border border-primary/20">
              <h2 className="font-serif text-xl font-semibold mb-4">Vous êtes connecté ?</h2>
              <p className="text-muted-foreground mb-4">
                Si vous avez un compte Tarot Divinatoire, vous pouvez exercer directement 
                la plupart de vos droits depuis votre profil :
              </p>
              <div className="flex flex-col sm:flex-row gap-4">
                <Link 
                  to="/app/profile" 
                  className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
                >
                  <Shield className="h-4 w-4" />
                  Accéder à mon profil
                </Link>
              </div>
            </section>

            {/* Vos droits */}
            <section className="p-6 rounded-xl bg-card border border-border/50">
              <h2 className="font-serif text-xl font-semibold mb-6">Vos droits en détail</h2>
              
              <div className="space-y-6">
                {/* Droit d'accès */}
                <div className="flex items-start gap-4 pb-6 border-b border-border/50">
                  <div className="p-2 rounded-lg bg-blue-500/10">
                    <FileText className="h-5 w-5 text-blue-500" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-medium mb-2">Droit d'accès (Article 15 RGPD)</h3>
                    <p className="text-sm text-muted-foreground">
                      Vous pouvez demander à savoir si nous traitons vos données et, le cas échéant, 
                      obtenir une copie de l'ensemble de ces données ainsi que des informations sur 
                      leur traitement.
                    </p>
                  </div>
                </div>

                {/* Droit de rectification */}
                <div className="flex items-start gap-4 pb-6 border-b border-border/50">
                  <div className="p-2 rounded-lg bg-green-500/10">
                    <Edit className="h-5 w-5 text-green-500" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-medium mb-2">Droit de rectification (Article 16 RGPD)</h3>
                    <p className="text-sm text-muted-foreground">
                      Vous pouvez demander la correction de données inexactes ou incomplètes 
                      vous concernant. Depuis votre profil, vous pouvez modifier directement 
                      certaines informations.
                    </p>
                  </div>
                </div>

                {/* Droit à l'effacement */}
                <div className="flex items-start gap-4 pb-6 border-b border-border/50">
                  <div className="p-2 rounded-lg bg-red-500/10">
                    <Trash2 className="h-5 w-5 text-red-500" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-medium mb-2">Droit à l'effacement (Article 17 RGPD)</h3>
                    <p className="text-sm text-muted-foreground">
                      Vous pouvez demander la suppression de vos données dans certains cas : 
                      données plus nécessaires, retrait du consentement, opposition au traitement. 
                      La suppression de compte est disponible directement dans votre profil.
                    </p>
                  </div>
                </div>

                {/* Droit à la portabilité */}
                <div className="flex items-start gap-4 pb-6 border-b border-border/50">
                  <div className="p-2 rounded-lg bg-purple-500/10">
                    <Download className="h-5 w-5 text-purple-500" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-medium mb-2">Droit à la portabilité (Article 20 RGPD)</h3>
                    <p className="text-sm text-muted-foreground">
                      Vous pouvez recevoir vos données dans un format structuré, couramment utilisé 
                      et lisible par machine (JSON). L'export est disponible directement depuis 
                      votre profil.
                    </p>
                  </div>
                </div>

                {/* Droit d'opposition */}
                <div className="flex items-start gap-4 pb-6 border-b border-border/50">
                  <div className="p-2 rounded-lg bg-orange-500/10">
                    <Ban className="h-5 w-5 text-orange-500" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-medium mb-2">Droit d'opposition (Article 21 RGPD)</h3>
                    <p className="text-sm text-muted-foreground">
                      Vous pouvez vous opposer au traitement de vos données pour des motifs 
                      légitimes, notamment pour la prospection commerciale. Le désabonnement 
                      aux emails marketing est disponible dans chaque email.
                    </p>
                  </div>
                </div>

                {/* Retrait du consentement */}
                <div className="flex items-start gap-4">
                  <div className="p-2 rounded-lg bg-yellow-500/10">
                    <Shield className="h-5 w-5 text-yellow-500" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-medium mb-2">Retrait du consentement</h3>
                    <p className="text-sm text-muted-foreground">
                      Lorsque le traitement est fondé sur votre consentement, vous pouvez le 
                      retirer à tout moment. Pour les cookies, utilisez le bouton "Modifier mes 
                      préférences" dans notre{' '}
                      <Link to="/legal/cookies" className="text-primary hover:underline">
                        politique cookies
                      </Link>.
                    </p>
                  </div>
                </div>
              </div>
            </section>

            {/* Comment exercer vos droits */}
            <section className="p-6 rounded-xl bg-card border border-border/50">
              <div className="flex items-start gap-4">
                <Mail className="h-5 w-5 text-primary mt-1" />
                <div className="flex-1">
                  <h2 className="font-serif text-xl font-semibold mb-4">Comment exercer vos droits ?</h2>
                  <div className="space-y-4 text-muted-foreground">
                    <p>
                      <strong className="text-foreground">Option 1 - Via votre profil :</strong><br />
                      Connectez-vous et accédez à votre{' '}
                      <Link to="/app/profile" className="text-primary hover:underline">profil</Link>{' '}
                      pour exporter vos données ou supprimer votre compte.
                    </p>
                    <p>
                      <strong className="text-foreground">Option 2 - Par email :</strong><br />
                      Envoyez votre demande à{' '}
                      <a href="mailto:contact@tarotdivinatoire.app" className="text-primary hover:underline">
                        contact@tarotdivinatoire.app
                      </a>{' '}
                      en précisant :
                    </p>
                    <ul className="list-disc list-inside space-y-1 ml-4">
                      <li>Votre nom et prénom</li>
                      <li>L'adresse email de votre compte (si applicable)</li>
                      <li>Le droit que vous souhaitez exercer</li>
                      <li>Une copie d'un justificatif d'identité (pour vérification)</li>
                    </ul>
                  </div>
                </div>
              </div>
            </section>

            {/* Délai de réponse */}
            <section className="p-6 rounded-xl bg-card border border-border/50">
              <div className="flex items-start gap-4">
                <Clock className="h-5 w-5 text-primary mt-1" />
                <div className="flex-1">
                  <h2 className="font-serif text-xl font-semibold mb-4">Délai de réponse</h2>
                  <div className="space-y-4 text-muted-foreground">
                    <p>
                      Conformément au RGPD, nous nous engageons à répondre à votre demande 
                      dans un délai de <strong className="text-foreground">1 mois</strong> 
                      à compter de sa réception.
                    </p>
                    <p>
                      Ce délai peut être prolongé de 2 mois supplémentaires en cas de demandes 
                      nombreuses ou complexes. Dans ce cas, nous vous en informerons dans le 
                      mois suivant votre demande.
                    </p>
                  </div>
                </div>
              </div>
            </section>

            {/* Réclamation CNIL */}
            <section className="p-6 rounded-xl bg-muted/50 border border-border/30">
              <h2 className="font-serif text-lg font-semibold mb-3">Réclamation auprès de la CNIL</h2>
              <p className="text-sm text-muted-foreground mb-4">
                Si vous estimez que vos droits ne sont pas respectés ou que le traitement 
                de vos données n'est pas conforme au RGPD, vous pouvez introduire une 
                réclamation auprès de la Commission Nationale de l'Informatique et des Libertés.
              </p>
              <a 
                href="https://www.cnil.fr/fr/plaintes" 
                target="_blank" 
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 text-primary hover:underline text-sm"
              >
                Déposer une plainte sur cnil.fr
                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                </svg>
              </a>
            </section>
          </div>
        </div>
      </div>
    </Layout>
  );
}
