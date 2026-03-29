alter table public.coupons
  add column if not exists valid_from date,
  add column if not exists valid_until date;

update public.coupons
set
  valid_from = coalesce(valid_from, created_at::date),
  valid_until = coalesce(valid_until, created_at::date)
where valid_from is null or valid_until is null;

alter table public.coupons
  alter column valid_from set not null,
  alter column valid_until set not null;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'coupons_valid_range_check'
      and conrelid = 'public.coupons'::regclass
  ) then
    alter table public.coupons
      add constraint coupons_valid_range_check
      check (valid_until >= valid_from);
  end if;
end
$$;
