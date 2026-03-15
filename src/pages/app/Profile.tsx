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
import { KarmaWidget } from '@/components/gamification/KarmaWidget';
import { AchievementsPanel } from '@/components/gamification/AchievementsPanel';
import {
  User, Download, Trash2, AlertTriangle, Shield, CheckCircle,
  Crown, CreditCard, Calendar, Sparkles, Trophy, Star, Loader2,
} from 'lucide-react';
import { ZodiacWidget } from '@/components/astrology';
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
  const { user, session, signOut } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { data: publicConfig, refetch: refetchConfig } = usePublicConfig();
  const { status: subscription, loading: subLoading, isPremium, startCheckout, checkoutLoading, openCustomerPortal } = useSubscription();

  const [exporting, setExporting] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [deleteStep, setDeleteStep] = useState<'idle' | 'confirm' | 'deleting' | 'done'>('idle');
  const [bootstrapToken, setBootstrapToken] = useState('');
  const [activating, setActivating] = useState(false);
  const [activated, setActivated] = useState(false);

  const canShowBootstrap = publicConfig?.admin_bootstrap_used === false;

  // ── Admin bootstrap ────────────────────────────────────────────────────────
  const handleBootstrapAdmin = async () => {
    if (!session?.access_token || !bootstrapToken.trim()) return;
    setActivating(true);
    try {
      const response = await supabase.functions.invoke('bootstrap-admin', {
        headers: { 'x-admin-bootstrap-token': bootstrapToken.trim() },
      });
      if (response.error) throw new Error(response.error.message || 'Bootstrap failed');
      setBootstrapToken('');
      setActivated(true);
      await refetchConfig();
      queryClient.invalidateQueries({ queryKey: ['user-roles'] });
      toast.success('Votre compte a été promu administrateur.');
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : "Impossible d'activer le compte admin.";
      setBootstrapToken('');
      toast.error(msg);
    } finally {
      setActivating(false);
    }
  };

  // ── RGPD Export via Edge Function ─────────────────────────────────────────
  const handleExportData = async () => {
    if (!user || !session) return;
    setExporting(true);
    try {
      const { data, error } = await supabase.functions.invoke('export-user-data', {
        method: 'POST',
      });
      if (error) throw new Error(error.message);

      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `tarot-data-export-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      toast.success('Vos données ont été téléchargées. Conformément au RGPD (Art. 20).');
    } catch {
      toast.error("Impossible d'exporter vos données. Réessayez dans quelques instants.");
    } finally {
      setExporting(false);
    }
  };

  // ── Real account deletion via Edge Function ───────────────────────────────
  const handleDeleteAccount = async () => {
    if (!user || !session) return;
    setDeleteStep('deleting');
    setDeleting(true);
    try {
      const { data, error } = await supabase.functions.invoke('delete-account', {
        method: 'POST',
        body: { confirmed: true },
      });

      if (error) throw new Error(error.message);
      if (!data?.success) throw new Error('Suppression échouée');

      // Clear all local state
      queryClient.clear();
      await signOut();

      setDeleteStep('done');
      toast.success('Votre compte a été définitivement supprimé.');

      // Redirect after short delay so user sees the message
      setTimeout(() => navigate('/', { replace: true }), 1500);
    } catch {
      setDeleteStep('idle');
      toast.error('Impossible de supprimer votre compte. Contactez contact@tarotdivinatoire.app.');
    } finally {
      setDeleting(false);
    }
  };

  // ── Deletion done screen ──────────────────────────────────────────────────
  if (deleteStep === 'done') {
    return (
      <Layout>
        <div className="min-h-screen flex items-center justify-center p-4">
          <div className="max-w-md w-full text-center space-y-6 animate-scale-in">
            <div className="w-20 h-20 mx-auto rounded-full bg-muted flex items-center justify-center">
              <CheckCircle className="h-10 w-10 text-muted-foreground" />
            </div>
            <h1 className="font-serif text-2xl">Compte supprimé</h1>
            <p className="text-muted-foreground">
              Votre compte et toutes vos données ont été supprimés définitivement.
              Vous ne pouvez plus vous reconnecter avec cet identifiant.
            </p>
            <Button onClick={() => navigate('/', { replace: true })} variant="outline">
              Retour à l'accueil
            </Button>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="container mx-auto px-4 py-8 md:py-14">
        <div className="max-w-2xl mx-auto space-y-8">

          {/* Header */}
          <div className="text-center space-y-4 animate-fade-in-up">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 text-primary">
              <User className="h-8 w-8" />
            </div>
            <h1 className="font-serif text-3xl md:text-4xl font-semibold">Mon Profil</h1>
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
                <div className="flex items-center gap-4 p-4 rounded-xl bg-secondary/10 border border-secondary/30">
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-secondary/20">
                    <Crown className="h-6 w-6 text-secondary-foreground" />
                  </div>
                  <div className="flex-1">
                    <p className="font-semibold" style={{ color: 'hsl(var(--mystic-gold))' }}>Abonnement Premium</p>
                    <p className="text-sm text-muted-foreground">Tirages illimités • Interprétations approfondies</p>
                  </div>
                </div>
                {subscription?.subscription_end && (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Calendar className="h-4 w-4" />
                    <span>
                      {subscription.cancel_at_period_end
                        ? `Se termine le ${new Date(subscription.subscription_end).toLocaleDateString('fr-FR')}`
                        : `Prochain renouvellement : ${new Date(subscription.subscription_end).toLocaleDateString('fr-FR')}`}
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
                    <p className="font-semibold">Accès Bêta Gratuit</p>
                    <p className="text-sm text-muted-foreground">Toutes les fonctionnalités sont disponibles pendant la bêta</p>
                  </div>
                </div>
                <div className="p-4 rounded-xl bg-primary/5 border border-primary/20">
                  <p className="text-sm mb-3">
                    Passez à <strong>Premium</strong> pour garantir votre accès et débloquer les interprétations approfondies après la bêta.
                  </p>
                  <Button onClick={startCheckout} disabled={checkoutLoading} className="w-full">
                    {checkoutLoading ? (
                      <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Chargement...</>
                    ) : (
                      <><Crown className="mr-2 h-4 w-4" />S'abonner – 3,90€/mois</>
                    )}
                  </Button>
                </div>
              </div>
            )}
          </div>

          {/* Admin Bootstrap */}
          {canShowBootstrap && !activated && (
            <div className="p-6 rounded-xl bg-primary/5 border border-primary/20 space-y-4 animate-fade-in-up">
              <div className="flex items-start gap-4">
                <Shield className="h-5 w-5 text-primary mt-0.5" />
                <div className="flex-1 space-y-4">
                  <div>
                    <h3 className="font-medium text-primary">Activer accès Admin</h3>
                    <p className="text-sm text-muted-foreground">Entrez le token d'administration pour activer votre compte admin.</p>
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
                    <Button onClick={handleBootstrapAdmin} disabled={activating || !bootstrapToken.trim()}>
                      {activating ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Activation...</> : 'Activer'}
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activated && (
            <div className="p-6 rounded-xl bg-primary/5 border border-primary/30 space-y-4 animate-scale-in">
              <div className="flex items-start gap-4">
                <CheckCircle className="h-5 w-5 text-primary mt-0.5" />
                <div className="flex-1">
                  <h3 className="font-medium text-primary">Admin activé</h3>
                  <p className="text-sm text-muted-foreground mb-4">Votre compte administrateur est maintenant actif.</p>
                  <Button onClick={() => navigate('/admin')}>Aller au tableau de bord admin</Button>
                </div>
              </div>
            </div>
          )}

          {/* Astrology */}
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <Star className="h-5 w-5 text-primary" />
              <h2 className="font-serif text-xl font-semibold">Profil Astral</h2>
            </div>
            <ZodiacWidget />
          </div>

          {/* Karma & Achievements */}
          <KarmaWidget />
          <div className="p-6 rounded-2xl space-y-4" style={{ background: 'hsl(var(--card) / 0.6)', border: '1px solid hsl(var(--border))' }}>
            <div className="flex items-center gap-3">
              <Trophy className="h-5 w-5 text-primary" />
              <h2 className="font-serif text-xl font-semibold">Succès</h2>
            </div>
            <AchievementsPanel />
          </div>

          {/* ─── RGPD Section ─────────────────────────────────────────────── */}
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <Shield className="h-5 w-5 text-primary" />
              <h2 className="font-serif text-xl font-semibold">Vos données (RGPD)</h2>
            </div>

            <p className="text-sm text-muted-foreground px-1">
              Conformément au Règlement Général sur la Protection des Données (RGPD), vous disposez d'un droit d'accès, de portabilité et d'effacement de vos données.
            </p>

            {/* Export */}
            <div className="p-6 rounded-xl bg-card border border-border/50 space-y-4">
              <div className="flex items-start gap-4">
                <Download className="h-5 w-5 text-primary mt-0.5 shrink-0" />
                <div className="flex-1 min-w-0">
                  <h3 className="font-medium">Exporter toutes mes données</h3>
                  <p className="text-sm text-muted-foreground mt-0.5">
                    Téléchargez une copie complète de vos données (profil, tirages, karma, consentements) au format JSON — Art. 20 RGPD.
                  </p>
                </div>
                <Button
                  variant="outline"
                  onClick={handleExportData}
                  disabled={exporting}
                  className="shrink-0"
                >
                  {exporting ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Export...</> : 'Exporter'}
                </Button>
              </div>
            </div>

            {/* Delete account */}
            <div className="p-6 rounded-xl bg-destructive/5 border border-destructive/20 space-y-4">
              <div className="flex items-start gap-4">
                <Trash2 className="h-5 w-5 text-destructive mt-0.5 shrink-0" />
                <div className="flex-1 min-w-0">
                  <h3 className="font-medium text-destructive">Supprimer mon compte</h3>
                  <p className="text-sm text-muted-foreground mt-0.5">
                    Suppression définitive et irréversible de votre compte et de toutes vos données — Art. 17 RGPD.
                    <br />
                    <span className="text-destructive/80 font-medium">Vous ne pourrez plus vous reconnecter.</span>
                  </p>
                </div>

                <AlertDialog
                  open={deleteStep === 'confirm'}
                  onOpenChange={(open) => {
                    if (!open && deleteStep === 'confirm') setDeleteStep('idle');
                  }}
                >
                  <AlertDialogTrigger asChild>
                    <Button
                      variant="destructive"
                      disabled={deleting}
                      className="shrink-0"
                      onClick={() => setDeleteStep('confirm')}
                    >
                      {deleting ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Supprimer'}
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle className="flex items-center gap-2">
                        <AlertTriangle className="h-5 w-5 text-destructive" />
                        Confirmer la suppression définitive
                      </AlertDialogTitle>
                      <AlertDialogDescription className="space-y-2">
                        <span className="block">
                          Cette action est <strong>irréversible</strong>. Les données suivantes seront définitivement supprimées :
                        </span>
                        <ul className="list-disc list-inside text-sm space-y-1 mt-2">
                          <li>Votre compte et informations personnelles</li>
                          <li>Tous vos tirages et interprétations</li>
                          <li>Votre historique, karma et succès</li>
                          <li>Vos abonnements et données de facturation</li>
                        </ul>
                        <span className="block mt-3 font-semibold text-destructive">
                          Vous ne pourrez plus vous reconnecter avec cet identifiant.
                        </span>
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel onClick={() => setDeleteStep('idle')}>Annuler</AlertDialogCancel>
                      <AlertDialogAction
                        onClick={handleDeleteAccount}
                        className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                        disabled={deleting}
                      >
                        {deleting
                          ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Suppression...</>
                          : 'Supprimer définitivement'}
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            </div>

            {/* Legal links */}
            <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground px-1">
              <a href="/legal/privacy" className="hover:text-foreground transition-colors">Politique de confidentialité</a>
              <a href="/legal/rights" className="hover:text-foreground transition-colors">Exercer mes droits</a>
              <a href="/legal/cookies" className="hover:text-foreground transition-colors">Politique cookies</a>
              <a href="mailto:contact@tarotdivinatoire.app" className="hover:text-foreground transition-colors">contact@tarotdivinatoire.app</a>
            </div>
          </div>

        </div>
      </div>
    </Layout>
  );
}
