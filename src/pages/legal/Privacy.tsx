import { Layout } from '@/components/layout/Layout';
import { Link } from 'react-router-dom';

export default function Privacy() {
  return (
    <Layout>
      <div className="container mx-auto px-4 py-16">
        <div className="max-w-3xl mx-auto prose prose-slate">
          <h1 className="font-serif text-3xl md:text-4xl font-semibold mb-8">
            Politique de Confidentialité
          </h1>
          
          <p className="text-muted-foreground mb-8">
            Dernière mise à jour : {new Date().toLocaleDateString('fr-FR')}
          </p>

          <section className="space-y-4 mb-8">
            <h2 className="font-serif text-xl font-semibold">1. Collecte des données</h2>
            <p className="text-muted-foreground">
              Nous collectons les informations suivantes lors de votre utilisation de Tarot Divinatoire :
            </p>
            <ul className="list-disc list-inside text-muted-foreground space-y-2">
              <li>Adresse email (pour l'authentification)</li>
              <li>Historique de vos tirages de tarot</li>
              <li>Préférences utilisateur (intention, domaine de vie préféré)</li>
            </ul>
          </section>

          <section className="space-y-4 mb-8">
            <h2 className="font-serif text-xl font-semibold">2. Utilisation des données</h2>
            <p className="text-muted-foreground">
              Vos données sont utilisées exclusivement pour :
            </p>
            <ul className="list-disc list-inside text-muted-foreground space-y-2">
              <li>Vous authentifier et sécuriser votre compte</li>
              <li>Personnaliser votre expérience de tirage</li>
              <li>Conserver l'historique de vos tirages</li>
              <li>Améliorer nos services</li>
            </ul>
          </section>

          <section className="space-y-4 mb-8">
            <h2 className="font-serif text-xl font-semibold">3. Protection des données</h2>
            <p className="text-muted-foreground">
              Nous mettons en œuvre des mesures de sécurité techniques et organisationnelles 
              pour protéger vos données personnelles contre l'accès non autorisé, la modification, 
              la divulgation ou la destruction.
            </p>
          </section>

          <section className="space-y-4 mb-8">
            <h2 className="font-serif text-xl font-semibold">4. Vos droits (RGPD)</h2>
            <p className="text-muted-foreground">
              Conformément au Règlement Général sur la Protection des Données (RGPD), vous disposez des droits suivants :
            </p>
            <ul className="list-disc list-inside text-muted-foreground space-y-2">
              <li><strong>Droit d'accès :</strong> Vous pouvez demander une copie de vos données</li>
              <li><strong>Droit de rectification :</strong> Vous pouvez modifier vos informations</li>
              <li><strong>Droit à l'effacement :</strong> Vous pouvez supprimer votre compte et toutes vos données</li>
              <li><strong>Droit à la portabilité :</strong> Vous pouvez exporter vos données au format JSON</li>
            </ul>
            <p className="text-muted-foreground mt-4">
              Pour exercer ces droits, rendez-vous dans votre{' '}
              <Link to="/profil" className="text-primary hover:underline">profil</Link>.
            </p>
          </section>

          <section className="space-y-4 mb-8">
            <h2 className="font-serif text-xl font-semibold">5. Conservation des données</h2>
            <p className="text-muted-foreground">
              Vos données sont conservées tant que votre compte est actif. 
              En cas de suppression de compte, toutes vos données personnelles 
              sont définitivement effacées de nos systèmes.
            </p>
          </section>

          <section className="space-y-4 mb-8">
            <h2 className="font-serif text-xl font-semibold">6. Cookies</h2>
            <p className="text-muted-foreground">
              Nous utilisons uniquement des cookies essentiels au fonctionnement 
              du service (authentification, préférences de session). 
              Aucun cookie publicitaire ou de tracking n'est utilisé.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="font-serif text-xl font-semibold">7. Contact</h2>
            <p className="text-muted-foreground">
              Pour toute question concernant cette politique de confidentialité, 
              vous pouvez nous contacter via les informations indiquées dans nos{' '}
              <Link to="/mentions-legales" className="text-primary hover:underline">
                mentions légales
              </Link>.
            </p>
          </section>
        </div>
      </div>
    </Layout>
  );
}
