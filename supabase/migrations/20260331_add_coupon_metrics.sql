alter table public.coupons
  add column if not exists coupon_count integer default 0,
  add column if not exists coupon_revenue integer default 0;

update public.coupons
set
  coupon_count = coalesce(coupon_count, 0),
  coupon_revenue = coalesce(coupon_revenue, 0)
where coupon_count is null
   or coupon_revenue is null;
