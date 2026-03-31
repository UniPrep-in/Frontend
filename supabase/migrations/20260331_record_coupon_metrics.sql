alter table if exists public.subscriptions
  add column if not exists coupon_metrics_recorded_at timestamp with time zone null;

create or replace function public.record_coupon_metrics_for_subscription(
  p_user_id uuid,
  p_order_id text,
  p_coupon_id uuid,
  p_coupon_revenue integer
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

revoke all on function public.record_coupon_metrics_for_subscription(uuid, text, uuid, integer) from public;
grant execute on function public.record_coupon_metrics_for_subscription(uuid, text, uuid, integer) to service_role;
