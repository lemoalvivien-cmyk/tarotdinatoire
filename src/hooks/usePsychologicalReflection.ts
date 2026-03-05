import { useState, useCallback } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

export interface PsychReflection {
  emotional_insight: string;
  shadow_aspect: string;
  light_aspect: string;
  reflection_question: string;
  growth_suggestion: string;
  affirmation: string;
  archetype: string;
  safety_note: string | null;
}

export function usePsychologicalReflection(drawId: string | null) {
  const { session } = useAuth();
  const queryClient = useQueryClient();
  const [isGenerating, setIsGenerating] = useState(false);

  const { data, isLoading } = useQuery({
    queryKey: ['psych-reflection', drawId],
    queryFn: async (): Promise<{ reflection: PsychReflection; cached: boolean } | null> => {
      if (!drawId || !session?.access_token) return null;
      const resp = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/psychological-reflection`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${session.access_token}`,
          },
          body: JSON.stringify({ draw_id: drawId }),
        }
      );
      if (resp.status === 429) {
        toast.error('Trop de demandes — réessaie dans un moment.');
        return null;
      }
      if (resp.status === 402) {
        const d = await resp.json();
        return d.reflection ? { reflection: d.reflection as PsychReflection, cached: false } : null;
      }
      if (!resp.ok) return null;
      return resp.json();
    },
    enabled: !!drawId && !!session?.access_token,
    staleTime: Infinity, // reflections are cached indefinitely
    retry: false,
  });

  const regenerate = useCallback(async (): Promise<void> => {
    if (!drawId || !session?.access_token) return;
    setIsGenerating(true);
    try {
      const resp = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/psychological-reflection`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${session.access_token}`,
          },
          body: JSON.stringify({ draw_id: drawId, force_regenerate: true }),
        }
      );
      if (resp.status === 429) { toast.error('Trop de demandes — réessaie dans un moment.'); return; }
      if (!resp.ok) { toast.error('Impossible de régénérer la réflexion.'); return; }
      const d = await resp.json();
      queryClient.setQueryData(['psych-reflection', drawId], d);
    } finally {
      setIsGenerating(false);
    }
  }, [drawId, session, queryClient]);

  return {
    reflection: data?.reflection ?? null,
    cached: data?.cached ?? false,
    isLoading,
    isGenerating,
    regenerate,
  };
}
