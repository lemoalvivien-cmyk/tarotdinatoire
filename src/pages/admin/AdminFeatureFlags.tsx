import { useState } from 'react';
import { Layout } from '@/components/layout/Layout';
import { useFeatureFlags } from '@/hooks/useFeatureFlags';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useQueryClient } from '@tanstack/react-query';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import {
  Settings, AlertTriangle, ShoppingBag, CreditCard, Users,
  BookOpen, Zap, Brain, Headphones, Crown,
} from 'lucide-react';
import { toast } from 'sonner';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';

type FlagKey =
  | 'maintenance_mode'
  | 'enable_shop'
  | 'enable_billing'
  | 'enable_waitlist'
  | 'enable_unlimited_readings'
  | 'enable_advanced_spreads'
  | 'enable_ai_deep_analysis'
  | 'enable_audio_readings'
  | 'enable_relationship_analysis';

interface FlagConfig {
  key: FlagKey;
  label: string;
  description: string;
  icon: React.ReactNode;
  dangerous?: boolean;
  premium?: boolean;
}

const SYSTEM_FLAGS: FlagConfig[] = [
  {
    key: 'maintenance_mode',
    label: 'Mode maintenance',
    description: 'Active le mode maintenance. Seuls les admins pourront acceder au site.',
    icon: <AlertTriangle className="h-5 w-5" />,
    dangerous: true,
  },
  {
    key: 'enable_shop',
    label: 'Boutique',
    description: 'Active la boutique en ligne.',
    icon: <ShoppingBag className="h-5 w-5" />,
  },
  {
    key: 'enable_billing',
    label: 'Facturation',
    description: 'Active le systeme de facturation et abonnements.',
    icon: <CreditCard className="h-5 w-5" />,
  },
  {
    key: 'enable_waitlist',
    label: "Liste d'attente",
    description: "Active la liste d'attente pour les nouvelles inscriptions.",
    icon: <Users className="h-5 w-5" />,
  },
];

const PREMIUM_FLAGS: FlagConfig[] = [
  {
    key: 'enable_unlimited_readings',
    label: 'Tirages illimites',
    description: 'Permet aux abonnes premium de faire des tirages sans limite de credits.',
    icon: <BookOpen className="h-5 w-5" />,
    premium: true,
  },
  {
    key: 'enable_advanced_spreads',
    label: 'Spreads avances',
    description: 'Donne acces a la Croix Celtique, le Chemin de Vie et spreads complexes.',
    icon: <Zap className="h-5 w-5" />,
    premium: true,
  },
  {
    key: 'enable_ai_deep_analysis',
    label: 'Analyse IA profonde',
    description: "Active les interpretations approfondies et l'analyse psychologique IA.",
    icon: <Brain className="h-5 w-5" />,
    premium: true,
  },
  {
    key: 'enable_audio_readings',
    label: 'Lectures audio',
    description: 'Active la narration vocale mystique via ElevenLabs TTS.',
    icon: <Headphones className="h-5 w-5" />,
    premium: true,
  },
  {
    key: 'enable_relationship_analysis',
    label: 'Analyse relationnelle',
    description: 'Active les spreads dedies aux relations amoureuses et compatibilites.',
    icon: <Users className="h-5 w-5" />,
    premium: true,
  },
];

function FlagCard({ flag, value, updating, onToggle }: {
  flag: FlagConfig;
  value: boolean;
  updating: boolean;
  onToggle: (key: FlagKey, val: boolean) => void;
}) {
  return (
    <Card className={flag.dangerous ? 'border-destructive/50' : flag.premium ? 'border-primary/30' : ''}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-lg ${
              flag.dangerous
                ? 'bg-destructive/10 text-destructive'
                : flag.premium
                  ? 'bg-primary/15 text-primary'
                  : 'bg-muted text-muted-foreground'
            }`}>
              {flag.icon}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <CardTitle className="text-base">{flag.label}</CardTitle>
                {flag.premium && (
                  <Badge variant="outline" className="text-xs border-primary/40 text-primary px-1.5 py-0">
                    <Crown className="h-2.5 w-2.5 mr-1" />Premium
                  </Badge>
                )}
              </div>
              <CardDescription className="text-xs mt-0.5">{flag.description}</CardDescription>
            </div>
          </div>
          <Switch
            checked={value}
            onCheckedChange={(checked) => onToggle(flag.key, checked)}
            disabled={updating}
          />
        </div>
      </CardHeader>
    </Card>
  );
}

export default function AdminFeatureFlags() {
  const { data: flags, isLoading } = useFeatureFlags();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [updating, setUpdating] = useState<string | null>(null);

  const handleToggle = async (key: FlagKey, newValue: boolean) => {
    if (!user) return;
    setUpdating(key);
    try {
      const { error: updateError } = await supabase
        .from('feature_flags')
        .update({ [key]: newValue, updated_at: new Date().toISOString() })
        .eq('id', 1);

      if (updateError) throw updateError;

      const { error: logError } = await supabase
        .from('admin_audit_logs')
        .insert({
          admin_user_id: user.id,
          action: 'update_feature_flag',
          target_type: 'feature_flags',
          target_id: key,
          metadata: { key, old_value: !newValue, new_value: newValue },
        });

      if (logError) console.error('Failed to log action:', logError);

      await queryClient.invalidateQueries({ queryKey: ['feature-flags'] });

      const allFlags = [...SYSTEM_FLAGS, ...PREMIUM_FLAGS];
      toast.success(`${allFlags.find(f => f.key === key)?.label} ${newValue ? 'active' : 'desactive'}`);
    } catch (error) {
      console.error('Error updating flag:', error);
      toast.error('Erreur lors de la mise a jour');
    } finally {
      setUpdating(null);
    }
  };

  if (isLoading) {
    return (
      <Layout>
        <div className="container mx-auto px-4 py-16">
          <div className="animate-pulse space-y-4">
            <div className="h-8 bg-muted rounded w-1/4" />
            <div className="h-32 bg-muted rounded" />
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="container mx-auto px-4 py-16">
        <div className="max-w-3xl mx-auto space-y-8">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                <Settings className="h-6 w-6 text-primary" />
              </div>
              <div>
                <h1 className="font-serif text-2xl md:text-3xl font-semibold">Feature Flags</h1>
                <p className="text-muted-foreground text-sm">Gestion des fonctionnalites et monetisation</p>
              </div>
            </div>
            <Button variant="outline" asChild>
              <Link to="/admin">Dashboard</Link>
            </Button>
          </div>

          {/* System flags */}
          <section className="space-y-3">
            <div className="flex items-center gap-2">
              <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
                Systeme
              </h2>
              <Separator className="flex-1" />
            </div>
            {SYSTEM_FLAGS.map((flag) => (
              <FlagCard
                key={flag.key}
                flag={flag}
                value={flags?.[flag.key as keyof typeof flags] as boolean ?? false}
                updating={updating === flag.key}
                onToggle={handleToggle}
              />
            ))}
          </section>

          {/* Premium feature flags */}
          <section className="space-y-3">
            <div className="flex items-center gap-2">
              <Crown className="h-4 w-4 text-primary" />
              <h2 className="text-sm font-semibold uppercase tracking-wider text-primary">
                Fonctionnalites Premium
              </h2>
              <Separator className="flex-1" />
            </div>
            <p className="text-xs text-muted-foreground">
              Ces flags controlent quelles fonctionnalites sont accessibles aux abonnes premium.
              Desactiver un flag retire immediatement l'acces meme aux abonnes actifs.
            </p>
            {PREMIUM_FLAGS.map((flag) => (
              <FlagCard
                key={flag.key}
                flag={flag}
                value={flags?.[flag.key as keyof typeof flags] as boolean ?? true}
                updating={updating === flag.key}
                onToggle={handleToggle}
              />
            ))}
          </section>

          {/* Maintenance warning banner */}
          {flags?.maintenance_mode && (
            <Card className="border-destructive bg-destructive/5">
              <CardContent className="pt-6">
                <div className="flex items-center gap-3 text-destructive">
                  <AlertTriangle className="h-5 w-5" />
                  <p className="font-medium text-sm">
                    Le mode maintenance est actif. Les utilisateurs sont rediriges vers /status.
                  </p>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </Layout>
  );
}
