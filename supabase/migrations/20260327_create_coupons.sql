create table if not exists public.coupons (
  id uuid not null default gen_random_uuid(),
  code text not null,
  influencer_name text not null,
  discount_type text not null,
  discount_value numeric(10, 2) not null,
  allowed_plan_ids text[] not null default '{}'::text[],
  is_active boolean not null default true,
  valid_from date not null,
  valid_until date not null,
  created_by uuid null,
  created_at timestamp with time zone not null default now(),
  updated_at timestamp with time zone not null default now(),
  constraint coupons_pkey primary key (id),
  constraint coupons_created_by_fkey foreign key (created_by) references auth.users (id) on delete set null,
  constraint coupons_discount_type_check check (
    discount_type = any (array['percent'::text, 'fixed'::text])
  ),
  constraint coupons_discount_value_check check (discount_value > 0::numeric),
  constraint coupons_valid_range_check check (valid_until >= valid_from)
);

create unique index if not exists coupons_code_key
  on public.coupons using btree (upper(code));

alter table public.coupons enable row level security;

do $$
begin
  if not exists (
    select 1
    from pg_policies
    where schemaname = 'public'
      and tablename = 'coupons'
      and policyname = 'Admins can view coupons'
  ) then
    create policy "Admins can view coupons"
    on public.coupons
    for select
    to authenticated
    using (
      exists (
        select 1
        from public.profiles
        where profiles.id = auth.uid()
          and profiles.is_admin = true
      )
    );
  end if;
end
$$;

do $$
begin
  if not exists (
    select 1
    from pg_policies
    where schemaname = 'public'
      and tablename = 'coupons'
      and policyname = 'Admins can insert coupons'
  ) then
    create policy "Admins can insert coupons"
    on public.coupons
    for insert
    to authenticated
    with check (
      exists (
        select 1
        from public.profiles
        where profiles.id = auth.uid()
          and profiles.is_admin = true
      )
    );
  end if;
end
$$;

do $$
begin
  if not exists (
    select 1
    from pg_policies
    where schemaname = 'public'
      and tablename = 'coupons'
      and policyname = 'Admins can update coupons'
  ) then
    create policy "Admins can update coupons"
    on public.coupons
    for update
    to authenticated
    using (
      exists (
        select 1
        from public.profiles
        where profiles.id = auth.uid()
          and profiles.is_admin = true
      )
    )
    with check (
      exists (
        select 1
        from public.profiles
        where profiles.id = auth.uid()
          and profiles.is_admin = true
      )
    );
  end if;
end
$$;
