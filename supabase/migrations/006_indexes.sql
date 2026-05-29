create index items_client_id_idx on public.items(client_id);
create index items_status_idx on public.items(status);
create index items_category_idx on public.items(category);
create index items_sku_idx on public.items(sku);
create index items_tags_idx on public.items using gin(tags);
create index items_search_idx on public.items
  using gin(to_tsvector('english', coalesce(name,'') || ' ' || coalesce(brand,'') || ' ' || coalesce(description,'')));

create index item_photos_item_id_idx on public.item_photos(item_id);

create index item_conditions_item_id_idx on public.item_conditions(item_id);
create index item_conditions_assessed_at_idx on public.item_conditions(assessed_at desc);

create index addresses_profile_id_idx on public.addresses(profile_id);

create index client_profiles_stripe_customer_idx on public.client_profiles(stripe_customer_id);
