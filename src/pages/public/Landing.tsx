import { Link } from 'react-router-dom';
import { Layout } from '@/components/layout/Layout';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { Sparkles, Stars, Moon, Sun, ArrowRight } from 'lucide-react';
import { SEOHead } from '@/components/seo/SEOHead';

const Landing = () => {
  const { user } = useAuth();

  return (
    <Layout>
      <SEOHead
        title="Tarot Divinatoire - VERSION BÊTA GRATUITE | Guidance & Introspection"
        description="Découvrez votre avenir avec le Tarot Divinatoire. VERSION BÊTA GRATUITE. Interprétations créées par 30 tarologues professionnels. Guidance, introspection et développement personnel."
        ogTitle="Tarot Divinatoire - VERSION BÊTA GRATUITE"
        ogDescription="Guidance mystique et introspection personnelle. Fait avec le savoir-faire de 30 tarologues professionnels. Essayez gratuitement."
      />
      {/* Hero Section */}
      <section className="relative min-h-[80vh] flex items-center justify-center overflow-hidden">
        {/* Decorative elements */}
        <div className="absolute top-20 left-10 text-primary/20 animate-float">
          <Moon className="h-16 w-16" />
        </div>
        <div className="absolute top-40 right-20 text-secondary/30 animate-float" style={{ animationDelay: '2s' }}>
          <Sun className="h-12 w-12" />
        </div>
        <div className="absolute bottom-40 left-1/4 text-mystic-lavender/40 animate-twinkle">
          <Stars className="h-8 w-8" />
        </div>
        <div className="absolute top-1/3 right-1/4 text-mystic-gold/30 animate-twinkle" style={{ animationDelay: '1s' }}>
          <Sparkles className="h-6 w-6" />
        </div>

        <div className="container mx-auto px-4 py-20 relative z-10">
          <div className="max-w-3xl mx-auto text-center space-y-8 animate-fade-in-up">
            {/* Beta Badge */}
            <div className="flex justify-center">
              <div className="beta-badge">
                <Sparkles className="h-3 w-3" />
                VERSION BÊTA GRATUITE
              </div>
            </div>

            {/* Main Heading */}
            <h1 className="font-serif text-4xl md:text-6xl lg:text-7xl font-semibold leading-tight">
              Découvrez les messages
              <span className="block text-primary">de l'univers</span>
            </h1>

            {/* Subtitle */}
            <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed">
              Une expérience de tarot divinatoire unique, guidée par l'intelligence artificielle 
              et le savoir-faire d'une trentaine de tarologues professionnels.
            </p>

            {/* CTA */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4">
              {user ? (
                <Link to="/app">
                  <Button size="lg" className="btn-mystic text-lg px-8 py-6 group">
                    Accéder à mon espace
                    <ArrowRight className="ml-2 h-5 w-5 transition-transform group-hover:translate-x-1" />
                  </Button>
                </Link>
              ) : (
                <>
                  <Link to="/auth">
                    <Button size="lg" className="btn-mystic text-lg px-8 py-6 group">
                      Commencer votre voyage
                      <ArrowRight className="ml-2 h-5 w-5 transition-transform group-hover:translate-x-1" />
                    </Button>
                  </Link>
                  <Link to="/disclaimer">
                    <Button variant="outline" size="lg" className="text-lg px-8 py-6">
                      En savoir plus
                    </Button>
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-card/30">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="font-serif text-3xl md:text-4xl font-semibold mb-4">
              Une guidance authentique
            </h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Notre approche combine tradition ancestrale et technologie moderne 
              pour vous offrir une expérience de tarot unique.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            <div className="text-center space-y-4 p-6 rounded-xl bg-card border border-border/50 shadow-soft">
              <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-primary/10 text-primary">
                <Stars className="h-7 w-7" />
              </div>
              <h3 className="font-serif text-xl font-semibold">Tirages intuitifs</h3>
              <p className="text-sm text-muted-foreground">
                Choisissez parmi différents types de tirages adaptés à vos questions.
              </p>
            </div>

            <div className="text-center space-y-4 p-6 rounded-xl bg-card border border-border/50 shadow-soft">
              <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-secondary/30 text-foreground">
                <Sparkles className="h-7 w-7" />
              </div>
              <h3 className="font-serif text-xl font-semibold">Interprétation IA</h3>
              <p className="text-sm text-muted-foreground">
                Une IA formée par 30 tarologues experts pour des interprétations profondes.
              </p>
            </div>

            <div className="text-center space-y-4 p-6 rounded-xl bg-card border border-border/50 shadow-soft">
              <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-accent text-accent-foreground">
                <Moon className="h-7 w-7" />
              </div>
              <h3 className="font-serif text-xl font-semibold">Journal personnel</h3>
              <p className="text-sm text-muted-foreground">
                Conservez l'historique de vos tirages et suivez votre évolution.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Trust Section */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto text-center space-y-6 p-8 rounded-2xl glass-mystic">
            <p className="font-serif text-xl md:text-2xl text-foreground italic">
              "Fait et développé avec le savoir-faire d'une trentaine de Tarologues professionnels"
            </p>
            <div className="flex items-center justify-center gap-2 text-muted-foreground">
              <div className="h-px w-12 bg-border" />
              <Sparkles className="h-4 w-4 text-primary" />
              <div className="h-px w-12 bg-border" />
            </div>
            <p className="text-sm text-muted-foreground">
              Notre engagement : vous offrir une guidance respectueuse, éthique et véritablement éclairante.
            </p>
          </div>
        </div>
      </section>
    </Layout>
  );
};

export default Landing;
