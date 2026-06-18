-- Re-point investor_document_views.document_id to documents(id).
-- The room is pre-launch so existing rows are test data — truncate rather than remap.

truncate public.investor_document_views;

alter table public.investor_document_views
  drop constraint investor_document_views_document_id_fkey,
  add constraint investor_document_views_document_id_fkey
    foreign key (document_id) references public.documents(id) on delete cascade;
