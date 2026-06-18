-- §C: Data Room Currency View
-- Surfaces reconcile status and freshness-SLA signals for the admin panel.
-- security_barrier prevents RLS leakage; admin panel queries via service-role client.

create or replace view public.data_room_currency
  with (security_barrier = true) as
select
  id,
  section,
  title,
  audience,
  is_published,
  content_status,
  source_name,
  source_version,
  published_at,
  last_reconciled_at,
  (
    last_reconciled_at is null
    or last_reconciled_at < now() - interval '7 days'
  ) as reconcile_overdue
from public.investor_documents
where is_published = true;
