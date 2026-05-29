alter table public.profiles enable row level security;
alter table public.client_profiles enable row level security;
alter table public.addresses enable row level security;
alter table public.providers enable row level security;
alter table public.items enable row level security;
alter table public.item_photos enable row level security;
alter table public.item_conditions enable row level security;

create or replace function public.get_my_role()
returns user_role
language sql security definer stable
as $$
  select role from public.profiles where id = auth.uid();
$$;

-- profiles
create policy "profiles_select_own"
  on public.profiles for select
  using (id = auth.uid());

create policy "profiles_select_admin"
  on public.profiles for select
  using (public.get_my_role() = 'admin');

create policy "profiles_update_own"
  on public.profiles for update
  using (id = auth.uid())
  with check (
    id = auth.uid()
    and role = (select role from public.profiles where id = auth.uid())
  );

create policy "profiles_update_admin"
  on public.profiles for update
  using (public.get_my_role() = 'admin');

create policy "profiles_insert_own"
  on public.profiles for insert
  with check (id = auth.uid());

-- client_profiles
create policy "client_profiles_select_own"
  on public.client_profiles for select
  using (profile_id = auth.uid());

create policy "client_profiles_update_own"
  on public.client_profiles for update
  using (profile_id = auth.uid());

create policy "client_profiles_all_admin"
  on public.client_profiles for all
  using (public.get_my_role() = 'admin');

-- addresses
create policy "addresses_all_own"
  on public.addresses for all
  using (profile_id = auth.uid())
  with check (profile_id = auth.uid());

create policy "addresses_all_admin"
  on public.addresses for all
  using (public.get_my_role() = 'admin');

-- providers
create policy "providers_select_own"
  on public.providers for select
  using (profile_id = auth.uid());

create policy "providers_all_admin"
  on public.providers for all
  using (public.get_my_role() = 'admin');

-- items
create policy "items_select_own_client"
  on public.items for select
  using (client_id = auth.uid());

create policy "items_insert_own_client"
  on public.items for insert
  with check (client_id = auth.uid());

create policy "items_update_own_client"
  on public.items for update
  using (client_id = auth.uid())
  with check (
    client_id = auth.uid()
    and status = (select status from public.items where id = items.id)
  );

create policy "items_all_admin"
  on public.items for all
  using (public.get_my_role() = 'admin');

-- item_photos
create policy "item_photos_select_client"
  on public.item_photos for select
  using (
    exists (
      select 1 from public.items
      where items.id = item_photos.item_id
      and items.client_id = auth.uid()
    )
  );

create policy "item_photos_insert_client"
  on public.item_photos for insert
  with check (
    uploaded_by = auth.uid()
    and exists (
      select 1 from public.items
      where items.id = item_photos.item_id
      and items.client_id = auth.uid()
    )
  );

create policy "item_photos_all_admin"
  on public.item_photos for all
  using (public.get_my_role() = 'admin');

-- item_conditions
create policy "item_conditions_select_client"
  on public.item_conditions for select
  using (
    exists (
      select 1 from public.items
      where items.id = item_conditions.item_id
      and items.client_id = auth.uid()
    )
  );

create policy "item_conditions_insert_staff"
  on public.item_conditions for insert
  with check (public.get_my_role() in ('admin', 'provider'));

create policy "item_conditions_all_admin"
  on public.item_conditions for all
  using (public.get_my_role() = 'admin');
