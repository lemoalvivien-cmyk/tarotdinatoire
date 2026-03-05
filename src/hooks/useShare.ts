import { useState, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface SharePayload {
  draw_id?: string;
  reading_id?: string;
  card_id: string;
  card_name_fr: string;
  orientation: string;
  interp_title?: string;
  interp_summary?: string;
  image_url?: string;
}

export interface ShareResult {
  share_id: string;
  referral_code: string;
  share_url: string;
}

export function useShare() {
  const { session } = useAuth();
  const [isCreating, setIsCreating] = useState(false);
  const [shareResult, setShareResult] = useState<ShareResult | null>(null);

  const createShare = useCallback(async (payload: SharePayload): Promise<ShareResult | null> => {
    if (!session?.access_token) {
      toast.error('Connectez-vous pour partager');
      return null;
    }
    setIsCreating(true);
    try {
      const resp = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/og-share`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${session.access_token}`,
          },
          body: JSON.stringify(payload),
        }
      );
      if (!resp.ok) {
        const err = await resp.json().catch(() => ({}));
        throw new Error(err.error ?? 'Erreur lors du partage');
      }
      const data: ShareResult = await resp.json();
      setShareResult(data);
      return data;
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Impossible de créer le lien');
      return null;
    } finally {
      setIsCreating(false);
    }
  }, [session]);

  const fetchShare = useCallback(async (shareId: string) => {
    const resp = await fetch(
      `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/og-share?id=${shareId}&format=json`,
    );
    if (!resp.ok) return null;
    const data = await resp.json();
    return data.share ?? null;
  }, []);

  const copyShareLink = useCallback((url: string) => {
    navigator.clipboard.writeText(url).then(() => {
      toast.success('Lien copié ! ✨');
    });
  }, []);

  const getShareCountForDraw = useCallback(async (cardId: string): Promise<number> => {
    const { count } = await supabase
      .from('shared_readings')
      .select('id', { count: 'exact', head: true })
      .eq('card_id', cardId);
    return count ?? 0;
  }, []);

  return {
    isCreating,
    shareResult,
    createShare,
    fetchShare,
    copyShareLink,
    getShareCountForDraw,
  };
}
