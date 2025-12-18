import { Layout } from '@/components/layout/Layout';
import { Star } from 'lucide-react';

export default function Favorites() {
  return (
    <Layout>
      <div className="container mx-auto px-4 py-16">
        <div className="max-w-4xl mx-auto space-y-8">
          <div className="text-center space-y-4 animate-fade-in-up">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-secondary/30 text-foreground">
              <Star className="h-8 w-8" />
            </div>
            <h1 className="font-serif text-3xl md:text-4xl font-semibold">
              Mes Favoris
            </h1>
            <p className="text-muted-foreground">
              Vos tirages marqués comme favoris.
            </p>
          </div>

          <div className="p-12 rounded-2xl glass-mystic shadow-soft text-center animate-scale-in">
            <p className="text-muted-foreground">
              Vous n'avez pas encore de tirages favoris.
            </p>
          </div>
        </div>
      </div>
    </Layout>
  );
}
