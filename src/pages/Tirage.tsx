import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Layout } from '@/components/layout/Layout';
import { useAuth } from '@/contexts/AuthContext';
import { Sparkles, Loader2 } from 'lucide-react';

export default function Tirage() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && !user) {
      navigate('/auth');
    }
  }, [user, loading, navigate]);

  if (loading) {
    return (
      <Layout>
        <div className="min-h-[60vh] flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </Layout>
    );
  }

  if (!user) return null;

  return (
    <Layout>
      <div className="container mx-auto px-4 py-16">
        <div className="max-w-4xl mx-auto text-center space-y-8">
          {/* Header */}
          <div className="space-y-4 animate-fade-in-up">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 text-primary">
              <Sparkles className="h-8 w-8" />
            </div>
            <h1 className="font-serif text-3xl md:text-4xl font-semibold">
              Tirage de Tarot
            </h1>
            <p className="text-muted-foreground">
              Concentrez-vous sur votre question et laissez les cartes vous guider.
            </p>
          </div>

          {/* Placeholder - Coming next */}
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
