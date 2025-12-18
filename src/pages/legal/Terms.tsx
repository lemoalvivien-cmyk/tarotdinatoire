import { Layout } from '@/components/layout/Layout';

export default function Terms() {
  return (
    <Layout>
      <div className="container mx-auto px-4 py-16">
        <div className="max-w-3xl mx-auto prose prose-slate">
          <h1 className="font-serif text-3xl md:text-4xl font-semibold mb-8">
            Conditions Générales d'Utilisation
          </h1>
          
          <p className="text-muted-foreground mb-8">
            Dernière mise à jour : {new Date().toLocaleDateString('fr-FR')}
          </p>

          <section className="space-y-4 mb-8">
            <h2 className="font-serif text-xl font-semibold">1. Objet</h2>
            <p className="text-muted-foreground">
              Les présentes Conditions Générales d'Utilisation (CGU) régissent l'utilisation 
              du service Tarot Divinatoire, accessible via notre plateforme web. 
              En utilisant ce service, vous acceptez ces conditions dans leur intégralité.
            </p>
          </section>

          <section className="space-y-4 mb-8">
            <h2 className="font-serif text-xl font-semibold">2. Description du service</h2>
            <p className="text-muted-foreground">
              Tarot Divinatoire est une plateforme de tirage de tarot assisté par intelligence 
              artificielle, conçue pour offrir une guidance spirituelle et favoriser l'introspection 
              personnelle. Le service est actuellement proposé en version bêta gratuite.
            </p>
          </section>

          <section className="space-y-4 mb-8">
            <h2 className="font-serif text-xl font-semibold">3. Inscription et compte</h2>
            <p className="text-muted-foreground">
              L'accès aux fonctionnalités de tirage nécessite la création d'un compte. 
              Vous êtes responsable de la confidentialité de vos identifiants et de 
              toutes les activités effectuées depuis votre compte.
            </p>
          </section>

          <section className="space-y-4 mb-8">
            <h2 className="font-serif text-xl font-semibold">4. Limitation de responsabilité</h2>
            <div className="p-4 bg-muted/50 rounded-lg border border-border">
              <p className="text-muted-foreground font-medium">
                IMPORTANT : Le service Tarot Divinatoire est fourni à titre informatif 
                et de divertissement uniquement. Les interprétations proposées :
              </p>
              <ul className="list-disc list-inside text-muted-foreground space-y-2 mt-4">
                <li>Ne constituent PAS des conseils médicaux</li>
                <li>Ne constituent PAS des conseils juridiques</li>
                <li>Ne constituent PAS des conseils financiers</li>
                <li>Ne prédisent PAS l'avenir de manière certaine</li>
              </ul>
            </div>
            <p className="text-muted-foreground mt-4">
              Pour toute décision importante dans ces domaines, consultez toujours 
              un professionnel qualifié. Vous restez seul responsable de vos choix 
              et décisions.
            </p>
          </section>

          <section className="space-y-4 mb-8">
            <h2 className="font-serif text-xl font-semibold">5. Propriété intellectuelle</h2>
            <p className="text-muted-foreground">
              Tous les éléments du service (textes, graphismes, logos, algorithmes) 
              sont protégés par le droit de la propriété intellectuelle. 
              Toute reproduction non autorisée est interdite.
            </p>
          </section>

          <section className="space-y-4 mb-8">
            <h2 className="font-serif text-xl font-semibold">6. Utilisation acceptable</h2>
            <p className="text-muted-foreground">
              Vous vous engagez à utiliser le service de manière responsable et à ne pas :
            </p>
            <ul className="list-disc list-inside text-muted-foreground space-y-2">
              <li>Utiliser le service à des fins illégales</li>
              <li>Tenter de contourner les mesures de sécurité</li>
              <li>Partager votre compte avec des tiers</li>
              <li>Utiliser des systèmes automatisés pour accéder au service</li>
            </ul>
          </section>

          <section className="space-y-4 mb-8">
            <h2 className="font-serif text-xl font-semibold">7. Modification des CGU</h2>
            <p className="text-muted-foreground">
              Nous nous réservons le droit de modifier ces CGU à tout moment. 
              Les modifications entrent en vigueur dès leur publication. 
              Votre utilisation continue du service vaut acceptation des nouvelles conditions.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="font-serif text-xl font-semibold">8. Droit applicable</h2>
            <p className="text-muted-foreground">
              Les présentes CGU sont régies par le droit français. 
              Tout litige sera soumis aux tribunaux compétents.
            </p>
          </section>
        </div>
      </div>
    </Layout>
  );
}
