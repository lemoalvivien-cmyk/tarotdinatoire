import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Layout } from '@/components/layout/Layout';
import { useAuth } from '@/contexts/AuthContext';
import { User, Loader2 } from 'lucide-react';

export default function Profil() {
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
        <div className="max-w-2xl mx-auto space-y-8">
          {/* Header */}
          <div className="text-center space-y-4 animate-fade-in-up">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 text-primary">
              <User className="h-8 w-8" />
            </div>
            <h1 className="font-serif text-3xl md:text-4xl font-semibold">
              Mon Profil
            </h1>
            <p className="text-muted-foreground">
              Gérez vos informations et préférences.
            </p>
          </div>

          {/* User info placeholder */}
          <div className="p-8 rounded-2xl glass-mystic shadow-soft space-y-6 animate-scale-in">
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">Email</p>
              <p className="font-medium">{user.email}</p>
            </div>
            
            <div className="pt-4 border-t border-border">
              <p className="text-muted-foreground text-sm">
                Les fonctionnalités complètes du profil (export de données, suppression de compte, préférences) 
                seront implémentées dans la prochaine étape.
              </p>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}
