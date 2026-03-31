alter table if exists public.flash_cards enable row level security;

do $$
begin
  if exists (
    select 1
    from information_schema.tables
    where table_schema = 'public'
      and table_name = 'flash_cards'
  ) and not exists (
    select 1
    from pg_policies
    where schemaname = 'public'
      and tablename = 'flash_cards'
      and policyname = 'Anyone can view flash cards'
  ) then
    create policy "Anyone can view flash cards"
    on public.flash_cards
    for select
    to anon, authenticated
    using (true);
  end if;
end
$$;

do $$
begin
  if exists (
    select 1
    from information_schema.tables
    where table_schema = 'public'
      and table_name = 'flash_cards'
  ) and not exists (
    select 1
    from pg_policies
    where schemaname = 'public'
      and tablename = 'flash_cards'
      and policyname = 'Authenticated users can insert their own flash cards'
  ) then
    create policy "Authenticated users can insert their own flash cards"
    on public.flash_cards
    for insert
    to authenticated
    with check (auth.uid() = user_id);
  end if;
end
$$;
