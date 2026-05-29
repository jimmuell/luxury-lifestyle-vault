-- B3-05: Billing history cache (mirrors Stripe invoices for client-facing display)

CREATE TABLE billing_history_cache (
  id                     uuid        DEFAULT gen_random_uuid() PRIMARY KEY,
  client_id              uuid        NOT NULL REFERENCES profiles(id),
  stripe_invoice_id      text        NOT NULL UNIQUE,
  stripe_subscription_id text,
  order_id               uuid        REFERENCES orders(id),
  amount_cents           integer     NOT NULL,
  currency               text        NOT NULL DEFAULT 'usd',
  status                 text        NOT NULL DEFAULT 'open'
    CHECK (status IN ('open', 'paid', 'void', 'uncollectible')),
  description            text,
  pdf_url                text,
  hosted_url             text,
  invoice_date           timestamptz NOT NULL,
  period_start           timestamptz,
  period_end             timestamptz,
  refunded_at            timestamptz,
  refund_amount_cents    integer,
  created_at             timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE billing_history_cache ENABLE ROW LEVEL SECURITY;

CREATE POLICY "billing_cache_client_read" ON billing_history_cache FOR SELECT TO authenticated
  USING (client_id = auth.uid() OR public.get_my_role() = 'admin');

CREATE POLICY "billing_cache_system_write" ON billing_history_cache FOR ALL TO service_role
  USING (true) WITH CHECK (true);

CREATE INDEX idx_billing_cache_client ON billing_history_cache(client_id, invoice_date DESC);
CREATE INDEX idx_billing_cache_stripe ON billing_history_cache(stripe_invoice_id);
