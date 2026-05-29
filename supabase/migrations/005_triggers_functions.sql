create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public
as $$
begin
  insert into public.profiles (id, email, full_name)
  values (
    new.id,
    new.email,
    new.raw_user_meta_data->>'full_name'
  );
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

create or replace function public.handle_client_profile()
returns trigger language plpgsql security definer set search_path = public
as $$
begin
  if new.role = 'client' and (old is null or old.role != 'client') then
    insert into public.client_profiles (profile_id)
    values (new.id)
    on conflict (profile_id) do nothing;
  end if;
  return new;
end;
$$;

create trigger on_profile_role_set
  after insert or update of role on public.profiles
  for each row execute function public.handle_client_profile();

create or replace function public.handle_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger profiles_updated_at
  before update on public.profiles
  for each row execute function public.handle_updated_at();

create trigger client_profiles_updated_at
  before update on public.client_profiles
  for each row execute function public.handle_updated_at();

create trigger addresses_updated_at
  before update on public.addresses
  for each row execute function public.handle_updated_at();

create trigger providers_updated_at
  before update on public.providers
  for each row execute function public.handle_updated_at();

create trigger items_updated_at
  before update on public.items
  for each row execute function public.handle_updated_at();
