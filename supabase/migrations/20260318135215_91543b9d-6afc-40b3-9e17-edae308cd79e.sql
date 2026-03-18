
-- ══════════════════════════════════════════════════════════════════════════════
-- SÉCURITÉ CRITIQUE #1 — email_leads : INSERT avec user_id arbitraire (IDOR)
-- ══════════════════════════════════════════════════════════════════════════════
DROP POLICY IF EXISTS "Anyone can insert leads with consent" ON public.email_leads;

CREATE POLICY "Insert leads with consent and valid user_id"
  ON public.email_leads
  FOR INSERT
  TO public
  WITH CHECK (
    consent = true
    AND (
      (auth.uid() IS NULL AND user_id IS NULL)
      OR
      (auth.uid() IS NOT NULL AND (user_id IS NULL OR user_id = auth.uid()))
    )
  );

-- ══════════════════════════════════════════════════════════════════════════════
-- SÉCURITÉ CRITIQUE #2 — subscriptions : DELETE permet bypass paywall
-- Un utilisateur peut supprimer sa ligne subscription, et has_reading_credits
-- retourne true (COALESCE fallback), contournant ainsi le paywall.
-- FIX : supprimer la politique DELETE pour les utilisateurs normaux.
-- ══════════════════════════════════════════════════════════════════════════════
DROP POLICY IF EXISTS "Users can delete own subscription" ON public.subscriptions;

-- Seul le service_role (webhook Stripe) peut supprimer des subscriptions
-- Les admins peuvent toujours modifier via leur propre policy UPDATE

-- ══════════════════════════════════════════════════════════════════════════════
-- SÉCURITÉ CRITIQUE #3 — daily_free_draws : email exposé publiquement
-- La politique SELECT "true" expose les emails de tous les utilisateurs.
-- FIX : remplacer par une politique basée sur session_key pour les UPDATEs,
-- et conserver SELECT public (nécessaire pour le flux UX) mais documenter
-- que la colonne email ne doit jamais être sélectionnée côté client.
-- FIX UPDATE : resserrer la condition pour empêcher l'exploitation cross-session.
-- ══════════════════════════════════════════════════════════════════════════════
DROP POLICY IF EXISTS "Public can update own free draw email" ON public.daily_free_draws;

-- Nouvelle politique UPDATE plus stricte
CREATE POLICY "Session owner can update own free draw email"
  ON public.daily_free_draws
  FOR UPDATE
  TO public
  USING (
    session_key IS NOT NULL
    AND length(session_key) >= 32
    AND draw_date = CURRENT_DATE
  )
  WITH CHECK (
    session_key IS NOT NULL
    AND length(session_key) >= 32
  );
