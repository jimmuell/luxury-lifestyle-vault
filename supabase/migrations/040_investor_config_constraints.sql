-- Narrow investor_config read policy to investor/admin roles only
drop policy if exists "investor_config_select_authenticated" on public.investor_config;

create policy "investor_config_select_investor_or_admin"
  on public.investor_config for select
  using (public.get_my_role() in ('investor', 'admin'));

-- Enforce single-row invariant
create unique index investor_config_singleton_idx on public.investor_config ((true));
