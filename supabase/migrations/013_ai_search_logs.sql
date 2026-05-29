-- Sprint B1: AI search log table for cost monitoring and analytics.
-- Records every Haiku search call: query, result count, token usage, latency.
-- Admin-only read access; clients insert their own logs via server action.

CREATE TABLE ai_search_logs (
  id           uuid        DEFAULT gen_random_uuid() PRIMARY KEY,
  client_id    uuid        NOT NULL REFERENCES profiles(id),
  query        text        NOT NULL,
  result_count integer     NOT NULL DEFAULT 0,
  input_tokens integer,
  output_tokens integer,
  latency_ms   integer,
  created_at   timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE ai_search_logs ENABLE ROW LEVEL SECURITY;

-- Admins can read all logs
CREATE POLICY "ai_search_logs_admin_read" ON ai_search_logs FOR SELECT TO authenticated
  USING (public.get_my_role() = 'admin');

-- Clients insert their own (server action derives client_id from session)
CREATE POLICY "ai_search_logs_client_insert" ON ai_search_logs FOR INSERT TO authenticated
  WITH CHECK (client_id = auth.uid() OR public.get_my_role() = 'admin');

CREATE INDEX idx_ai_search_logs_client  ON ai_search_logs(client_id);
CREATE INDEX idx_ai_search_logs_created ON ai_search_logs(created_at DESC);
