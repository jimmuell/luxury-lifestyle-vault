-- Add unique constraint on storage_path so the seed script can upsert idempotently.
alter table public.investor_documents
  add constraint investor_documents_storage_path_key unique (storage_path);
