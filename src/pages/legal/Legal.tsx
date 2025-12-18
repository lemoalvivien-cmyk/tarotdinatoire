import { Layout } from '@/components/layout/Layout';

export default function Legal() {
  return (
    <Layout>
      <div className="container mx-auto px-4 py-16">
        <div className="max-w-3xl mx-auto prose prose-slate">
          <h1 className="font-serif text-3xl md:text-4xl font-semibold mb-8">
            Mentions Légales
          </h1>

          <section className="space-y-4 mb-8">
            <h2 className="font-serif text-xl font-semibold">1. Éditeur du site</h2>
            <p className="text-muted-foreground">
              Le site Tarot Divinatoire est édité par :
            </p>
            <div className="p-4 bg-muted/50 rounded-lg border border-border">
              <p className="text-muted-foreground">
                [Nom de la société ou du particulier]<br />
                [Adresse]<br />
                [Code postal, Ville]<br />
                [Pays]<br />
                Email : [contact@tarot-divinatoire.com]
              </p>
            </div>
          </section>

          <section className="space-y-4 mb-8">
            <h2 className="font-serif text-xl font-semibold">2. Directeur de la publication</h2>
            <p className="text-muted-foreground">
              [Nom du directeur de publication]
            </p>
          </section>

          <section className="space-y-4 mb-8">
            <h2 className="font-serif text-xl font-semibold">3. Hébergement</h2>
            <p className="text-muted-foreground">
              Le site est hébergé par :
            </p>
            <div className="p-4 bg-muted/50 rounded-lg border border-border">
              <p className="text-muted-foreground">
                Lovable / Supabase<br />
                Infrastructure cloud sécurisée
              </p>
            </div>
          </section>

          <section className="space-y-4 mb-8">
            <h2 className="font-serif text-xl font-semibold">4. Propriété intellectuelle</h2>
            <p className="text-muted-foreground">
              L'ensemble du contenu de ce site (textes, images, graphismes, logo, icônes, 
              logiciels, etc.) est la propriété exclusive de l'éditeur ou de ses partenaires. 
              Toute reproduction, représentation, modification, publication, adaptation ou 
              exploitation de tout ou partie des éléments du site, quel que soit le moyen 
              ou le procédé utilisé, est interdite, sauf autorisation écrite préalable.
            </p>
          </section>

          <section className="space-y-4 mb-8">
            <h2 className="font-serif text-xl font-semibold">5. Données personnelles</h2>
            <p className="text-muted-foreground">
              Conformément à la loi « Informatique et Libertés » du 6 janvier 1978 
              modifiée et au Règlement Général sur la Protection des Données (RGPD), 
              vous disposez d'un droit d'accès, de rectification, de suppression et 
              de portabilité de vos données personnelles.
            </p>
            <p className="text-muted-foreground">
              Pour plus d'informations, consultez notre{' '}
              <a href="/politique-confidentialite" className="text-primary hover:underline">
                politique de confidentialité
              </a>.
            </p>
          </section>

          <section className="space-y-4 mb-8">
            <h2 className="font-serif text-xl font-semibold">6. Cookies</h2>
            <p className="text-muted-foreground">
              Ce site utilise uniquement des cookies techniques nécessaires à son 
              fonctionnement (authentification, préférences). Aucun cookie publicitaire 
              ou de tracking tiers n'est utilisé.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="font-serif text-xl font-semibold">7. Crédits</h2>
            <p className="text-muted-foreground">
              Conception et développement : Tarot Divinatoire<br />
              Expertise tarot : Collectif de 30+ tarologues professionnels<br />
              Intelligence artificielle : Lovable AI
            </p>
          </section>
        </div>
      </div>
    </Layout>
  );
}
