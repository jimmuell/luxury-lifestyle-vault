-- B5-03: Provider messaging — extend concierge_messages for provider-originated threads

ALTER TABLE concierge_messages
  ADD COLUMN IF NOT EXISTS author_profile_id uuid REFERENCES profiles(id),
  ADD COLUMN IF NOT EXISTS related_order_id   uuid REFERENCES orders(id),
  ADD COLUMN IF NOT EXISTS thread_id          uuid,  -- groups replies; top-level message = its own id
  ADD COLUMN IF NOT EXISTS is_provider_message boolean NOT NULL DEFAULT false;

-- thread_id defaults to the row's own id for new top-level messages (done in app logic)
-- For replies, thread_id = the original message's id

CREATE INDEX IF NOT EXISTS idx_concierge_messages_thread ON concierge_messages(thread_id, created_at);
CREATE INDEX IF NOT EXISTS idx_concierge_messages_order  ON concierge_messages(related_order_id);

-- Providers can insert messages linked to orders they are assigned to
CREATE POLICY "providers_insert_messages" ON concierge_messages
  FOR INSERT TO authenticated
  WITH CHECK (
    get_my_role() = 'provider'
    AND is_provider_message = true
    AND related_order_id IS NOT NULL
    AND EXISTS (
      SELECT 1
      FROM provider_order_assignments poa
      JOIN providers p ON p.id = poa.provider_id
      WHERE poa.order_id = related_order_id
        AND p.profile_id = auth.uid()
    )
  );

-- Providers can read messages on orders they are assigned to
CREATE POLICY "providers_read_assigned_messages" ON concierge_messages
  FOR SELECT TO authenticated
  USING (
    get_my_role() = 'provider'
    AND related_order_id IS NOT NULL
    AND EXISTS (
      SELECT 1
      FROM provider_order_assignments poa
      JOIN providers p ON p.id = poa.provider_id
      WHERE poa.order_id = related_order_id
        AND p.profile_id = auth.uid()
    )
  );
