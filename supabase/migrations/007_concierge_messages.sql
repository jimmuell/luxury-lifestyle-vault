-- Concierge messaging stub for Phase A
-- Phase B will add threading, read receipts, and push notifications

CREATE TABLE IF NOT EXISTS concierge_messages (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id     uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  subject       text NOT NULL,
  body          text NOT NULL,
  status        text NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'in_progress', 'resolved')),
  admin_notes   text,
  created_at    timestamptz NOT NULL DEFAULT now(),
  updated_at    timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_concierge_messages_client_id ON concierge_messages(client_id);
CREATE INDEX idx_concierge_messages_status ON concierge_messages(status);
CREATE INDEX idx_concierge_messages_created_at ON concierge_messages(created_at DESC);

ALTER TABLE concierge_messages ENABLE ROW LEVEL SECURITY;

-- Clients can see and create their own messages
CREATE POLICY "clients_own_messages" ON concierge_messages
  FOR ALL USING (client_id = auth.uid());

-- Admins can see all messages
CREATE POLICY "admins_all_messages" ON concierge_messages
  FOR ALL USING (get_my_role() = 'admin');

-- updated_at trigger
CREATE TRIGGER set_concierge_messages_updated_at
  BEFORE UPDATE ON concierge_messages
  FOR EACH ROW EXECUTE FUNCTION handle_updated_at();
