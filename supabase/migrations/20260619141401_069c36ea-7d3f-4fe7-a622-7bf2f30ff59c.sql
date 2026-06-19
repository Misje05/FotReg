
-- Enums
do $$ begin
  create type public.order_type as enum ('punch_card','subscription');
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.order_status as enum ('pending','paid','failed');
exception when duplicate_object then null; end $$;

-- Orders table
create table public.orders (
  id uuid primary key default gen_random_uuid(),
  parent_id uuid not null,
  type public.order_type not null,
  credits integer,
  amount_cents integer not null,
  currency text not null default 'NOK',
  status public.order_status not null default 'pending',
  paid_at timestamptz,
  stripe_session_id text,
  created_at timestamptz not null default now()
);

grant select, insert on public.orders to authenticated;
grant all on public.orders to service_role;

alter table public.orders enable row level security;

create policy "parents view own orders or admin"
  on public.orders for select to authenticated
  using (parent_id = auth.uid() or public.has_role(auth.uid(), 'admin'));

create policy "parents insert own orders"
  on public.orders for insert to authenticated
  with check (parent_id = auth.uid());

-- Admin-only: mark an order paid and grant the corresponding credits
create or replace function public.mark_order_paid(_order_id uuid)
returns public.orders
language plpgsql
security definer
set search_path = public
as $$
declare
  _o public.orders%rowtype;
  _caller uuid := auth.uid();
begin
  if _caller is null then raise exception 'Not authenticated'; end if;
  if not public.has_role(_caller, 'admin') then
    raise exception 'Forbidden';
  end if;

  select * into _o from public.orders where id = _order_id for update;
  if not found then raise exception 'Order not found'; end if;
  if _o.status = 'paid' then return _o; end if;

  update public.orders
    set status = 'paid', paid_at = now()
    where id = _order_id
    returning * into _o;

  if _o.type = 'punch_card' then
    if _o.credits is null or _o.credits <= 0 then
      raise exception 'Order is missing credits';
    end if;
    insert into public.punch_cards (parent_id, total_credits, remaining_credits, status)
    values (_o.parent_id, _o.credits, _o.credits, 'active');
  elsif _o.type = 'subscription' then
    insert into public.subscriptions (parent_id, status, current_period_end)
    values (_o.parent_id, 'active', now() + interval '1 month');
  end if;

  return _o;
end;
$$;
