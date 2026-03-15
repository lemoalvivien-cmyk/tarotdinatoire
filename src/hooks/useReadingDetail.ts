/**
 * Hook: fetch a single reading session + result by session ID.
 * Used by ReadingDetail page (canonical /app/reading/:id route).
 */
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import type { TarotInterpretation } from '@/types/tarot';

export interface ReadingDetailData {
  id: string;
  user_id: string;
  spread_id: string;
  question: string | null;
  selected_cards: Array<{ card_id: string; orientation: 'upright' | 'reversed'; position_key: string }>;
  is_favorite: boolean;
  user_notes: string | null;
  origin_id: string | null;
  created_at: string;
  result_id: string | null;
  interpretation: TarotInterpretation | null;
}

export function useReadingDetail(sessionId: string | undefined) {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ['reading-detail', sessionId],
    queryFn: async (): Promise<ReadingDetailData> => {
      const { data, error } = await supabase
        .from('reading_sessions')
        .select('id, user_id, spread_id, question, selected_cards, is_favorite, user_notes, origin_id, created_at, reading_results(id, interpretation)')
        .eq('id', sessionId!)
        .maybeSingle();

      if (error) throw error;
      if (!data) throw new Error('NOT_FOUND');

      const result = (data as unknown as { reading_results: Array<{ id: string; interpretation: unknown }> }).reading_results?.[0];

      return {
        id: data.id,
        user_id: data.user_id,
        spread_id: data.spread_id,
        question: data.question,
        selected_cards: (data.selected_cards as unknown as ReadingDetailData['selected_cards']) ?? [],
        is_favorite: (data as unknown as { is_favorite: boolean }).is_favorite ?? false,
        user_notes: (data as unknown as { user_notes: string | null }).user_notes ?? null,
        origin_id: (data as unknown as { origin_id: string | null }).origin_id ?? null,
        created_at: data.created_at,
        result_id: result?.id ?? null,
        interpretation: result?.interpretation as TarotInterpretation | null ?? null,
      };
    },
    enabled: !!sessionId,
    retry: (count, err: unknown) => {
      if ((err as Error)?.message === 'NOT_FOUND') return false;
      return count < 2;
    },
  });

  // ─── Toggle favorite ──────────────────────────────────────────────────────
  const toggleFavorite = useMutation({
    mutationFn: async (newValue: boolean) => {
      const { error } = await supabase
        .from('reading_sessions')
        .update({ is_favorite: newValue })
        .eq('id', sessionId!);
      if (error) throw error;
    },
    onMutate: async (newValue) => {
      await queryClient.cancelQueries({ queryKey: ['reading-detail', sessionId] });
      const prev = queryClient.getQueryData(['reading-detail', sessionId]);
      queryClient.setQueryData(['reading-detail', sessionId], (old: ReadingDetailData | undefined) =>
        old ? { ...old, is_favorite: newValue } : old,
      );
      return { prev };
    },
    onError: (_, __, ctx) => {
      queryClient.setQueryData(['reading-detail', sessionId], ctx?.prev);
      toast.error('Erreur lors de la mise à jour du favori');
    },
    onSuccess: (_, newValue) => {
      toast.success(newValue ? 'Ajouté aux favoris ✨' : 'Retiré des favoris');
      queryClient.invalidateQueries({ queryKey: ['readings'] });
    },
  });

  // ─── Save user notes ──────────────────────────────────────────────────────
  const saveNotes = useMutation({
    mutationFn: async (notes: string) => {
      const { error } = await supabase
        .from('reading_sessions')
        .update({ user_notes: notes })
        .eq('id', sessionId!);
      if (error) throw error;
    },
    onError: () => toast.error('Erreur lors de la sauvegarde des notes'),
  });

  // ─── Delete session + result ──────────────────────────────────────────────
  const deleteReading = useMutation({
    mutationFn: async () => {
      // Delete result first (FK constraint)
      if (query.data?.result_id) {
        await supabase.from('reading_results').delete().eq('id', query.data.result_id);
      }
      const { error } = await supabase.from('reading_sessions').delete().eq('id', sessionId!);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success('Tirage supprimé');
      queryClient.invalidateQueries({ queryKey: ['readings'] });
    },
    onError: () => toast.error('Erreur lors de la suppression'),
  });

  // ─── Update interpretation (retry) ───────────────────────────────────────
  const updateInterpretation = useMutation({
    mutationFn: async (interpretation: TarotInterpretation) => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const interp = interpretation as any;
      if (query.data?.result_id) {
        const { error } = await supabase
          .from('reading_results')
          .update({ interpretation: interp })
          .eq('id', query.data.result_id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('reading_results')
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          .insert([{ session_id: sessionId!, interpretation: interp } as any]);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reading-detail', sessionId] });
    },
  });

  return { query, toggleFavorite, saveNotes, deleteReading, updateInterpretation };
}
