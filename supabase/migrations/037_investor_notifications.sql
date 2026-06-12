-- 037_investor_notifications.sql
-- Adds investor notification opt-in to profiles and a send-log table.

-- 1. Column on profiles -------------------------------------------------------
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS investor_notifications_opt_in boolean NOT NULL DEFAULT true;

-- 2. Send-log table ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.investor_notification_sends (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id  uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  document_id uuid NOT NULL REFERENCES public.investor_documents(id) ON DELETE CASCADE,
  sent_at     timestamptz NOT NULL DEFAULT now()
);

-- 3. RLS -----------------------------------------------------------------------
ALTER TABLE public.investor_notification_sends ENABLE ROW LEVEL SECURITY;

-- Admins can read all rows
CREATE POLICY "admin_select_all_investor_notification_sends"
  ON public.investor_notification_sends
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
        AND profiles.role = 'admin'
    )
  );

-- Each investor can see their own rows
CREATE POLICY "investor_select_own_investor_notification_sends"
  ON public.investor_notification_sends
  FOR SELECT
  TO authenticated
  USING (profile_id = auth.uid());
