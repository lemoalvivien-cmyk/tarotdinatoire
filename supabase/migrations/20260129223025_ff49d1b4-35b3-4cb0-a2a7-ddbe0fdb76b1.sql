-- Add DELETE policy for users on subscriptions table (RGPD compliance)
CREATE POLICY "Users can delete own subscription"
  ON public.subscriptions FOR DELETE
  USING (auth.uid() = user_id);