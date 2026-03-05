import { useMemo } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import {
  getZodiacSignFromDate,
  getZodiacById,
  ZODIAC_SIGNS,
  type ZodiacSign,
} from '@/utils/astrologyData';

export interface AstrologyProfile {
  birth_date: string | null; // ISO date string
  zodiac_sign: string | null; // sign id
}

export function useAstrology() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: profile, isLoading } = useQuery({
    queryKey: ['astrology-profile', user?.id],
    queryFn: async () => {
      if (!user) return null;
      const { data, error } = await supabase
        .from('profiles')
        .select('birth_date, zodiac_sign')
        .eq('id', user.id)
        .single();
      if (error) throw error;
      return data as AstrologyProfile;
    },
    enabled: !!user,
    staleTime: 60_000,
  });

  // Derive active zodiac sign
  const zodiacSign: ZodiacSign | null = useMemo(() => {
    if (profile?.zodiac_sign) return getZodiacById(profile.zodiac_sign) ?? null;
    if (profile?.birth_date) {
      return getZodiacSignFromDate(new Date(profile.birth_date));
    }
    return null;
  }, [profile]);

  const updateMutation = useMutation({
    mutationFn: async ({
      birth_date,
      zodiac_sign,
    }: {
      birth_date?: string | null;
      zodiac_sign?: string | null;
    }) => {
      if (!user) throw new Error('Non authentifié');

      // Auto-compute zodiac from birth date if not explicitly set
      let resolvedSign = zodiac_sign;
      if (!resolvedSign && birth_date) {
        const computed = getZodiacSignFromDate(new Date(birth_date));
        resolvedSign = computed?.id ?? null;
      }

      const { error } = await supabase
        .from('profiles')
        .update({
          birth_date: birth_date ?? null,
          zodiac_sign: resolvedSign ?? null,
          updated_at: new Date().toISOString(),
        })
        .eq('id', user.id);
      if (error) throw error;
      return resolvedSign;
    },
    onSuccess: (resolvedSign) => {
      queryClient.invalidateQueries({ queryKey: ['astrology-profile', user?.id] });
      queryClient.invalidateQueries({ queryKey: ['profile', user?.id] });
      const signObj = resolvedSign ? getZodiacById(resolvedSign) : null;
      toast.success(
        signObj
          ? `Profil astral mis à jour — ${signObj.name_fr} ${signObj.symbol}`
          : 'Profil astral mis à jour.'
      );
    },
    onError: () => {
      toast.error('Impossible de sauvegarder votre profil astral.');
    },
  });

  return {
    profile,
    zodiacSign,
    allSigns: ZODIAC_SIGNS,
    isLoading,
    updateAstrology: updateMutation.mutate,
    isSaving: updateMutation.isPending,
  };
}
