import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Layout } from '@/components/layout/Layout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { usePublicConfig } from '@/hooks/usePublicConfig';
import { useSubscription } from '@/hooks/useSubscription';
import { useQueryClient } from '@tanstack/react-query';
import { User, Download, Trash2, AlertTriangle, Shield, CheckCircle, Crown, CreditCard, Calendar, Sparkles } from 'lucide-react';
import { SubscriptionBadge } from '@/components/subscription';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';

export default function Profile() {
  const { user, session } = useAuth();
  const navigate = useNavigate();
  
  const queryClient = useQueryClient();
  const { data: publicConfig, refetch: refetchConfig } = usePublicConfig();
  const { status: subscription, loading: subLoading, isPremium, startCheckout, checkoutLoading, openCustomerPortal } = useSubscription();
  
  const [exporting, setExporting] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [bootstrapToken, setBootstrapToken] = useState('');
  const [activating, setActivating] = useState(false);
  const [activated, setActivated] = useState(false);

  // Show bootstrap section only if admin_bootstrap_used is false
  // Uses public-config edge function to avoid RLS errors for non-admin users
  const canShowBootstrap = publicConfig?.admin_bootstrap_used === false;

  const handleBootstrapAdmin = async () => {
    if (!session?.access_token || !bootstrapToken.trim()) return;
    
    setActivating(true);
    try {
      const response = await supabase.functions.invoke('bootstrap-admin', {
        headers: {
          'x-admin-bootstrap-token': bootstrapToken.trim(),
        },
      });

      if (response.error) {
        throw new Error(response.error.message || 'Bootstrap failed');
      }

      setBootstrapToken('');
      setActivated(true);
      
      // Refresh public config to update bootstrap status
      await refetchConfig();
      
      // Invalidate any admin-related queries
      queryClient.invalidateQueries({ queryKey: ['user-roles'] });
      
      toast.success("Votre compte a été promu administrateur.");
    } catch (error: any) {
      console.error('Bootstrap error:', error);
      setBootstrapToken('');
      toast.error(error.message || "Impossible d'activer le compte admin.");
    } finally {
      setActivating(false);
    }
  };

  const handleExportData = async () => {
    if (!user) return;
    
    setExporting(true);
    try {
      // Fetch all user data
      const [profileRes, readingsRes] = await Promise.all([
        supabase.from('profiles').select('*').eq('id', user.id).single(),
        // FIX CODE-7: bounded query — RGPD export limited to 500 most recent readings
        supabase.from('tarot_readings').select('*').eq('user_id', user.id).order('created_at', { ascending: false }).limit(500),
      ]);

      const exportData = {
        exportDate: new Date().toISOString(),
        user: {
          email: user.email,
          id: user.id,
        },
        profile: profileRes.data,
        readings: readingsRes.data || [],
      };

      // Download as JSON
      const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `tarot-divinatoire-export-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      toast.success("Vos données ont été téléchargées.");
    } catch (error) {
      console.error('Export error:', error);
      toast.error("Impossible d'exporter vos données.");
    } finally {
      setExporting(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (!user) return;
    
    setDeleting(true);
    try {
      // RGPD: Delete ALL user data from ALL tables
      // Order matters: delete dependent tables first
      
      // 1. Delete reading results (via reading_sessions FK)
      const { data: sessions } = await supabase
        .from('reading_sessions')
        .select('id')
        .eq('user_id', user.id);
      
      if (sessions && sessions.length > 0) {
        const sessionIds = sessions.map(s => s.id);
        await supabase.from('reading_results').delete().in('session_id', sessionIds);
      }
      
      // 2. Delete reading sessions
      await supabase.from('reading_sessions').delete().eq('user_id', user.id);
      
      // 3. Delete tarot readings
      await supabase.from('tarot_readings').delete().eq('user_id', user.id);
      
      // 4. Delete email leads (P3: RGPD compliance)
      await supabase.from('email_leads').delete().eq('user_id', user.id);
      
      // 5. Delete consent logs
      await supabase.from('consent_logs').delete().eq('user_id', user.id);
      
      // 6. Delete analytics events
      await supabase.from('analytics_events').delete().eq('user_id', user.id);
      
      // 7. Delete AI usage stats
      await supabase.from('ai_usage_daily').delete().eq('user_id', user.id);
      
      // 8. Delete subscriptions
      await supabase.from('subscriptions').delete().eq('user_id', user.id);
      
      // 9. Delete user roles
      await supabase.from('user_roles').delete().eq('user_id', user.id);
      
      // 10. Delete profile (should cascade from auth.users, but being explicit)
      await supabase.from('profiles').delete().eq('id', user.id);
      
      // Sign out
      await supabase.auth.signOut();
      
      toast.success("Votre compte et toutes vos données ont été supprimés.");
      navigate('/');
    } catch (error) {
      console.error('Delete error:', error);
      toast.error("Impossible de supprimer votre compte. Veuillez réessayer.");
    } finally {
      setDeleting(false);
    }
  };

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
          </div>

          {/* User Info */}
          <div className="p-6 rounded-2xl glass-mystic shadow-soft space-y-4 animate-scale-in">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">Email</p>
                <p className="font-medium">{user?.email}</p>
              </div>
              <SubscriptionBadge showCredits />
            </div>
          </div>

          {/* Subscription Section */}
          <div className="p-6 rounded-2xl glass-mystic shadow-soft space-y-4 animate-scale-in">
            <div className="flex items-center gap-3">
              <Crown className="h-5 w-5 text-primary" />
              <h2 className="font-serif text-xl font-semibold">Mon Abonnement</h2>
            </div>

            {subLoading ? (
              <div className="animate-pulse h-20 bg-muted/30 rounded-lg" />
            ) : isPremium ? (
              <div className="space-y-4">
                <div className="flex items-center gap-4 p-4 rounded-xl bg-gradient-to-r from-amber-500/10 to-orange-500/10 border border-amber-500/20">
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-amber-500/20">
                    <Crown className="h-6 w-6 text-amber-500" />
                  </div>
                  <div className="flex-1">
                    <p className="font-semibold text-amber-600 dark:text-amber-400">Abonnement Premium</p>
                    <p className="text-sm text-muted-foreground">
                      Tirages illimités • Interprétations approfondies
                    </p>
                  </div>
                </div>

                {subscription?.subscription_end && (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Calendar className="h-4 w-4" />
                    <span>
                      {subscription.cancel_at_period_end 
                        ? `Se termine le ${new Date(subscription.subscription_end).toLocaleDateString('fr-FR')}`
                        : `Prochain renouvellement : ${new Date(subscription.subscription_end).toLocaleDateString('fr-FR')}`
                      }
                    </span>
                  </div>
                )}

                <Button variant="outline" onClick={openCustomerPortal} className="w-full">
                  <CreditCard className="mr-2 h-4 w-4" />
                  Gérer mon abonnement
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="flex items-center gap-4 p-4 rounded-xl bg-muted/30 border border-border/50">
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted">
                    <Sparkles className="h-6 w-6 text-muted-foreground" />
                  </div>
                  <div className="flex-1">
                    <p className="font-semibold">Abonnement requis</p>
                    <p className="text-sm text-muted-foreground">
                      Souscrivez à l'offre Premium pour accéder aux tirages
                    </p>
                  </div>
                </div>

                <div className="p-4 rounded-xl bg-primary/5 border border-primary/20">
                  <p className="text-sm mb-3">
                    Passez à <strong>Premium</strong> pour débloquer les tirages illimités et les interprétations approfondies.
                  </p>
                  <Button onClick={startCheckout} disabled={checkoutLoading} className="w-full">
                    {checkoutLoading ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-2 border-current border-t-transparent mr-2" />
                        Chargement...
                      </>
                    ) : (
                      <>
                        <Crown className="mr-2 h-4 w-4" />
                        S'abonner – 3,90€/mois
                      </>
                    )}
                  </Button>
                </div>
              </div>
            )}
          </div>

          {/* Admin Bootstrap Section - Only visible before first admin is activated */}
          {canShowBootstrap && !activated && (
            <div className="p-6 rounded-xl bg-primary/5 border border-primary/20 space-y-4 animate-fade-in-up">
              <div className="flex items-start gap-4">
                <Shield className="h-5 w-5 text-primary mt-0.5" />
                <div className="flex-1 space-y-4">
                  <div>
                    <h3 className="font-medium text-primary">Activer accès Admin</h3>
                    <p className="text-sm text-muted-foreground">
                      Entrez le token d'administration pour activer votre compte admin.
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <Input
                      type="password"
                      placeholder="Token admin"
                      value={bootstrapToken}
                      onChange={(e) => setBootstrapToken(e.target.value)}
                      className="flex-1"
                      autoComplete="off"
                    />
                    <Button 
                      onClick={handleBootstrapAdmin}
                      disabled={activating || !bootstrapToken.trim()}
                    >
                      {activating ? 'Activation...' : 'Activer'}
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Admin Activated Success */}
          {activated && (
            <div className="p-6 rounded-xl bg-green-500/10 border border-green-500/30 space-y-4 animate-scale-in">
              <div className="flex items-start gap-4">
                <CheckCircle className="h-5 w-5 text-green-500 mt-0.5" />
                <div className="flex-1">
                  <h3 className="font-medium text-green-600 dark:text-green-400">Admin activé</h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    Votre compte administrateur est maintenant actif.
                  </p>
                  <Button onClick={() => navigate('/admin')}>
                    Aller au tableau de bord admin
                  </Button>
                </div>
              </div>
            </div>
          )}

          {/* RGPD Actions */}
          <div className="space-y-4">
            <h2 className="font-serif text-xl font-semibold">Vos données (RGPD)</h2>
            
            <div className="p-6 rounded-xl bg-card border border-border/50 space-y-4">
              <div className="flex items-start gap-4">
                <Download className="h-5 w-5 text-primary mt-0.5" />
                <div className="flex-1">
                  <h3 className="font-medium">Exporter mes données</h3>
                  <p className="text-sm text-muted-foreground">
                    Téléchargez une copie de toutes vos données au format JSON.
                  </p>
                </div>
                <Button 
                  variant="outline" 
                  onClick={handleExportData}
                  disabled={exporting}
                >
                  {exporting ? 'Export...' : 'Exporter'}
                </Button>
              </div>
            </div>

            <div className="p-6 rounded-xl bg-destructive/5 border border-destructive/20 space-y-4">
              <div className="flex items-start gap-4">
                <Trash2 className="h-5 w-5 text-destructive mt-0.5" />
                <div className="flex-1">
                  <h3 className="font-medium text-destructive">Supprimer mon compte</h3>
                  <p className="text-sm text-muted-foreground">
                    Cette action est irréversible. Toutes vos données seront définitivement supprimées.
                  </p>
                </div>
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="destructive" disabled={deleting}>
                      Supprimer
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle className="flex items-center gap-2">
                        <AlertTriangle className="h-5 w-5 text-destructive" />
                        Confirmer la suppression
                      </AlertDialogTitle>
                      <AlertDialogDescription>
                        Cette action est irréversible. Toutes vos données, y compris votre historique de tirages, 
                        seront définitivement supprimées. Voulez-vous vraiment continuer ?
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Annuler</AlertDialogCancel>
                      <AlertDialogAction
                        onClick={handleDeleteAccount}
                        className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                      >
                        Supprimer définitivement
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}
