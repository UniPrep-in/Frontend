alter table public.coupons
  alter column coupon_revenue type numeric(12,2)
  using coalesce(coupon_revenue, 0)::numeric(12,2),
  alter column coupon_revenue set default 0;

update public.coupons
set coupon_revenue = coalesce(coupon_revenue, 0)
where coupon_revenue is null;

drop function if exists public.record_coupon_metrics_for_subscription(uuid, text, uuid, integer);

create or replace function public.record_coupon_metrics_for_subscription(
  p_user_id uuid,
  p_order_id text,
  p_coupon_id uuid,
  p_coupon_revenue numeric
)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  v_subscription_id uuid;
  v_coupon_id uuid;
begin
  update public.subscriptions
  set
    coupon_metrics_recorded_at = now(),
    updated_at = now()
  where user_id = p_user_id
    and order_id = p_order_id
    and payment_status = 'verified'
    and coupon_metrics_recorded_at is null
  returning id into v_subscription_id;

  if v_subscription_id is null then
    return false;
  end if;

  update public.coupons
  set
    coupon_count = coalesce(coupon_count, 0) + 1,
    coupon_revenue = coalesce(coupon_revenue, 0) + greatest(coalesce(p_coupon_revenue, 0), 0),
    updated_at = now()
  where id = p_coupon_id
  returning id into v_coupon_id;

  if v_coupon_id is null then
    raise exception 'Coupon % not found while recording coupon metrics', p_coupon_id;
  end if;

  return true;
end;
$$;

revoke all on function public.record_coupon_metrics_for_subscription(uuid, text, uuid, numeric) from public;
grant execute on function public.record_coupon_metrics_for_subscription(uuid, text, uuid, numeric) to service_role;
