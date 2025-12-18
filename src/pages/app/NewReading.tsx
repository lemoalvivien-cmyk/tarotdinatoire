import { Layout } from '@/components/layout/Layout';
import { Sparkles } from 'lucide-react';
import { PageSkeleton } from '@/components/ui/skeleton';

export default function NewReading() {
  return (
    <Layout>
      <div className="container mx-auto px-4 py-16">
        <div className="max-w-4xl mx-auto text-center space-y-8">
          <div className="space-y-4 animate-fade-in-up">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 text-primary">
              <Sparkles className="h-8 w-8" />
            </div>
            <h1 className="font-serif text-3xl md:text-4xl font-semibold">
              Nouveau Tirage
            </h1>
            <p className="text-muted-foreground">
              Concentrez-vous sur votre question et laissez les cartes vous guider.
            </p>
          </div>

          <div className="p-12 rounded-2xl glass-mystic shadow-soft animate-scale-in">
            <p className="text-muted-foreground">
              L'interface de tirage sera implémentée dans la prochaine étape.
            </p>
          </div>
        </div>
      </div>
    </Layout>
  );
}
