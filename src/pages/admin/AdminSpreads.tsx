import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Layout } from '@/components/layout/Layout';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { 
  Shield, 
  Layers, 
  ArrowLeft, 
  ToggleLeft, 
  ToggleRight,
  Loader2,
  GripVertical
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';

interface TarotSpread {
  id: string;
  name_fr: string;
  description_fr: string | null;
  card_count: number;
  icon: string | null;
  is_enabled: boolean;
  sort_order: number;
}

export default function AdminSpreads() {
  const queryClient = useQueryClient();
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const { data: spreads, isLoading } = useQuery({
    queryKey: ['admin-spreads'],
    queryFn: async (): Promise<TarotSpread[]> => {
      const { data, error } = await supabase
        .from('tarot_spreads')
        .select('id, name_fr, description_fr, card_count, icon, is_enabled, sort_order')
        .order('sort_order', { ascending: true });

      if (error) throw error;
      return data as TarotSpread[];
    },
  });

  const toggleMutation = useMutation({
    mutationFn: async ({ id, is_enabled }: { id: string; is_enabled: boolean }) => {
      const { error } = await supabase
        .from('tarot_spreads')
        .update({ is_enabled })
        .eq('id', id);

      if (error) throw error;
    },
    onMutate: async ({ id }) => {
      setUpdatingId(id);
    },
    onSuccess: (_, { id, is_enabled }) => {
      queryClient.invalidateQueries({ queryKey: ['admin-spreads'] });
      toast.success(`Tirage ${is_enabled ? 'activé' : 'désactivé'}`);
    },
    onError: (error) => {
      console.error('Toggle spread error:', error);
      toast.error("Erreur lors de la mise à jour");
    },
    onSettled: () => {
      setUpdatingId(null);
    },
  });

  const enabledCount = spreads?.filter(s => s.is_enabled).length ?? 0;
  const totalCount = spreads?.length ?? 0;

  return (
    <Layout>
      <div className="container mx-auto px-4 py-16">
        <div className="max-w-4xl mx-auto space-y-8">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button variant="ghost" size="icon" asChild>
                <Link to="/admin">
                  <ArrowLeft className="h-5 w-5" />
                </Link>
              </Button>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                  <Layers className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <h1 className="font-serif text-2xl font-semibold">Gestion des Tirages</h1>
                  <p className="text-sm text-muted-foreground">
                    {enabledCount}/{totalCount} actifs
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Spreads List */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5" />
                Tirages disponibles
              </CardTitle>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
              ) : spreads && spreads.length > 0 ? (
                <div className="space-y-3">
                  {spreads.map((spread) => (
                    <div
                      key={spread.id}
                      className="flex items-center gap-4 p-4 rounded-xl border border-border/50 bg-card/50 hover:bg-card/80 transition-colors"
                    >
                      <GripVertical className="h-5 w-5 text-muted-foreground/50 cursor-grab" />
                      
                      <span className="text-2xl">{spread.icon || '🔮'}</span>
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <h3 className="font-medium truncate">{spread.name_fr}</h3>
                          <Badge variant="secondary" className="text-xs">
                            {spread.card_count} cartes
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground truncate">
                          {spread.description_fr || 'Aucune description'}
                        </p>
                      </div>

                      <div className="flex items-center gap-3">
                        {spread.is_enabled ? (
                          <ToggleRight className="h-5 w-5 text-green-500" />
                        ) : (
                          <ToggleLeft className="h-5 w-5 text-muted-foreground" />
                        )}
                        <Switch
                          checked={spread.is_enabled}
                          disabled={updatingId === spread.id}
                          onCheckedChange={(checked) => 
                            toggleMutation.mutate({ id: spread.id, is_enabled: checked })
                          }
                        />
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-center text-muted-foreground py-12">
                  Aucun tirage configuré
                </p>
              )}
            </CardContent>
          </Card>

          {/* Info */}
          <div className="text-sm text-muted-foreground text-center">
            <p>Les tirages désactivés ne sont plus visibles dans l'application.</p>
          </div>
        </div>
      </div>
    </Layout>
  );
}
