import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Layout } from '@/components/layout/Layout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { Shield, Loader2, AlertTriangle } from 'lucide-react';

export default function BootstrapAdmin() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isChecking, setIsChecking] = useState(true);
  const [adminExists, setAdminExists] = useState(false);

  useEffect(() => {
    checkAdminExists();
  }, []);

  const checkAdminExists = async () => {
    try {
      const { count, error } = await supabase
        .from('user_roles')
        .select('*', { count: 'exact', head: true })
        .eq('role', 'admin');

      if (error) {
        console.error('Error checking admin:', error);
        setAdminExists(true); // Fail safe
        return;
      }

      setAdminExists((count || 0) > 0);
    } catch (err) {
      console.error('Error:', err);
      setAdminExists(true);
    } finally {
      setIsChecking(false);
    }
  };

  const handleBootstrap = async () => {
    if (!email.trim()) {
      toast.error('Veuillez entrer l\'email autorisé');
      return;
    }

    setIsLoading(true);

    try {
      const { data, error } = await supabase.rpc('bootstrap_first_admin', {
        allowed_email: email.trim().toLowerCase()
      });

      if (error) {
        if (error.message.includes('Admin already exists')) {
          toast.error('Un administrateur existe déjà');
          setAdminExists(true);
        } else if (error.message.includes('Email mismatch')) {
          toast.error('L\'email ne correspond pas à votre compte');
        } else {
          toast.error(error.message);
        }
        return;
      }

      toast.success('Vous êtes maintenant administrateur !');
      navigate('/admin');
    } catch (err) {
      console.error('Bootstrap error:', err);
      toast.error('Une erreur est survenue');
    } finally {
      setIsLoading(false);
    }
  };

  if (isChecking) {
    return (
      <Layout>
        <div className="container mx-auto px-4 py-16 flex items-center justify-center min-h-[60vh]">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </Layout>
    );
  }

  // If admin exists, redirect or show message
  if (adminExists) {
    return (
      <Layout>
        <div className="container mx-auto px-4 py-16">
          <Card className="max-w-md mx-auto">
            <CardHeader className="text-center">
              <div className="mx-auto w-12 h-12 rounded-full bg-muted flex items-center justify-center mb-4">
                <AlertTriangle className="h-6 w-6 text-muted-foreground" />
              </div>
              <CardTitle>Bootstrap non disponible</CardTitle>
              <CardDescription>
                Un administrateur existe déjà. Cette page n'est plus accessible.
              </CardDescription>
            </CardHeader>
            <CardContent className="text-center">
              <Button onClick={() => navigate('/app/dashboard')} variant="outline">
                Retour au tableau de bord
              </Button>
            </CardContent>
          </Card>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="container mx-auto px-4 py-16">
        <Card className="max-w-md mx-auto">
          <CardHeader className="text-center">
            <div className="mx-auto w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-4">
              <Shield className="h-6 w-6 text-primary" />
            </div>
            <CardTitle>Bootstrap Premier Admin</CardTitle>
            <CardDescription>
              Aucun administrateur n'existe. Vous pouvez devenir le premier admin en confirmant votre email.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="p-3 rounded-lg bg-amber-500/10 border border-amber-500/20 text-sm">
              <p className="text-amber-600 dark:text-amber-400">
                ⚠️ Cette action est irréversible. Seul l'utilisateur dont l'email correspond sera promu admin.
              </p>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">
                Email autorisé (doit correspondre à votre compte)
              </label>
              <Input
                type="email"
                placeholder="votre@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={isLoading}
              />
              {user?.email && (
                <p className="text-xs text-muted-foreground">
                  Votre email actuel : {user.email}
                </p>
              )}
            </div>

            <Button
              onClick={handleBootstrap}
              disabled={isLoading || !email.trim()}
              className="w-full"
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Vérification...
                </>
              ) : (
                <>
                  <Shield className="mr-2 h-4 w-4" />
                  Devenir Administrateur
                </>
              )}
            </Button>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
}
