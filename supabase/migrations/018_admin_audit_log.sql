-- B6-05: Admin audit trail

CREATE TABLE admin_audit_log (
  id              uuid        DEFAULT gen_random_uuid() PRIMARY KEY,
  actor_id        uuid        NOT NULL REFERENCES profiles(id),
  action          text        NOT NULL,
  entity_type     text        NOT NULL,
  entity_id       text,
  before_state    jsonb,
  after_state     jsonb,
  metadata        jsonb       NOT NULL DEFAULT '{}',
  created_at      timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE admin_audit_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "audit_log_admin_read" ON admin_audit_log FOR SELECT TO authenticated
  USING (public.get_my_role() = 'admin');

CREATE POLICY "audit_log_system_write" ON admin_audit_log FOR INSERT TO service_role
  WITH CHECK (true);

CREATE INDEX idx_audit_log_actor ON admin_audit_log(actor_id, created_at DESC);
CREATE INDEX idx_audit_log_entity ON admin_audit_log(entity_type, entity_id);
CREATE INDEX idx_audit_log_created ON admin_audit_log(created_at DESC);
