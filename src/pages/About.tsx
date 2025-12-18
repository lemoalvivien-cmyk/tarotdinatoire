import { Layout } from '@/components/layout/Layout';
import { Sparkles, Heart, Shield, Users, BookOpen, Stars } from 'lucide-react';

export default function About() {
  return (
    <Layout>
      <div className="container mx-auto px-4 py-16">
        <div className="max-w-4xl mx-auto space-y-16">
          {/* Hero */}
          <div className="text-center space-y-6 animate-fade-in-up">
            <div className="beta-badge mx-auto">
              <Sparkles className="h-3 w-3" />
              VERSION BÊTA GRATUITE
            </div>
            <h1 className="font-serif text-4xl md:text-5xl font-semibold">
              À propos de <span className="text-primary">Tarot Divinatoire</span>
            </h1>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Une plateforme de guidance spirituelle conçue avec soin, 
              alliant tradition ancestrale et intelligence artificielle.
            </p>
          </div>

          {/* Mission */}
          <section className="space-y-6">
            <h2 className="font-serif text-2xl md:text-3xl font-semibold text-center">
              Notre mission
            </h2>
            <div className="p-8 rounded-2xl glass-mystic shadow-soft">
              <p className="text-muted-foreground leading-relaxed text-center">
                Nous croyons que le tarot est un outil précieux d'introspection et de réflexion personnelle. 
                Notre mission est de rendre cette sagesse ancestrale accessible à tous, 
                en combinant l'expertise de tarologues professionnels avec les possibilités 
                offertes par l'intelligence artificielle.
              </p>
            </div>
          </section>

          {/* Expertise */}
          <section className="space-y-8">
            <div className="text-center space-y-4">
              <h2 className="font-serif text-2xl md:text-3xl font-semibold">
                Une expertise collective
              </h2>
              <p className="text-muted-foreground">
                Fait et développé avec le savoir-faire d'une trentaine de Tarologues professionnels.
              </p>
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              <div className="p-6 rounded-xl bg-card border border-border/50 shadow-soft space-y-4">
                <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-primary/10 text-primary">
                  <Users className="h-6 w-6" />
                </div>
                <h3 className="font-serif text-xl font-semibold">30+ Tarologues</h3>
                <p className="text-sm text-muted-foreground">
                  Notre équipe de tarologues expérimentés a contribué à l'élaboration 
                  des interprétations et des méthodologies de tirage.
                </p>
              </div>

              <div className="p-6 rounded-xl bg-card border border-border/50 shadow-soft space-y-4">
                <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-secondary/30 text-foreground">
                  <BookOpen className="h-6 w-6" />
                </div>
                <h3 className="font-serif text-xl font-semibold">Tradition préservée</h3>
                <p className="text-sm text-muted-foreground">
                  Chaque interprétation respecte les significations traditionnelles 
                  des arcanes tout en s'adaptant à votre contexte personnel.
                </p>
              </div>
            </div>
          </section>

          {/* Values */}
          <section className="space-y-8">
            <h2 className="font-serif text-2xl md:text-3xl font-semibold text-center">
              Nos valeurs
            </h2>
            
            <div className="grid md:grid-cols-3 gap-6">
              <div className="text-center space-y-4 p-6">
                <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-accent text-accent-foreground">
                  <Heart className="h-7 w-7" />
                </div>
                <h3 className="font-serif text-lg font-semibold">Bienveillance</h3>
                <p className="text-sm text-muted-foreground">
                  Chaque interprétation est formulée avec respect et dans une optique 
                  de guidance positive.
                </p>
              </div>

              <div className="text-center space-y-4 p-6">
                <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-primary/10 text-primary">
                  <Shield className="h-7 w-7" />
                </div>
                <h3 className="font-serif text-lg font-semibold">Éthique</h3>
                <p className="text-sm text-muted-foreground">
                  Nous ne prétendons jamais remplacer un avis médical, juridique ou financier 
                  professionnel.
                </p>
              </div>

              <div className="text-center space-y-4 p-6">
                <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-secondary/30 text-foreground">
                  <Stars className="h-7 w-7" />
                </div>
                <h3 className="font-serif text-lg font-semibold">Authenticité</h3>
                <p className="text-sm text-muted-foreground">
                  Une approche sincère du tarot comme outil d'introspection, 
                  pas de prédictions fantaisistes.
                </p>
              </div>
            </div>
          </section>

          {/* Disclaimer */}
          <section className="p-8 rounded-2xl bg-muted/50 border border-border/50 space-y-4">
            <h3 className="font-serif text-xl font-semibold text-center">
              Information importante
            </h3>
            <p className="text-sm text-muted-foreground text-center leading-relaxed">
              Le tarot divinatoire est un outil de réflexion et d'introspection personnelle. 
              Les interprétations proposées ne constituent en aucun cas des conseils médicaux, 
              juridiques, financiers ou professionnels. Pour toute question importante dans ces 
              domaines, veuillez consulter un professionnel qualifié. Votre libre arbitre 
              reste toujours votre meilleur guide.
            </p>
          </section>
        </div>
      </div>
    </Layout>
  );
}
