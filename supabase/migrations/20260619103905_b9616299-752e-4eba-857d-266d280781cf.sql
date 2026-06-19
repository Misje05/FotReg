
-- Roles
create type public.app_role as enum ('admin', 'parent');

create table public.user_roles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  role app_role not null,
  created_at timestamptz not null default now(),
  unique (user_id, role)
);
grant select on public.user_roles to authenticated;
grant all on public.user_roles to service_role;
alter table public.user_roles enable row level security;
create policy "users see own roles" on public.user_roles for select to authenticated using (user_id = auth.uid());

create or replace function public.has_role(_user_id uuid, _role app_role)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.user_roles where user_id = _user_id and role = _role)
$$;

-- Children
create table public.children (
  id uuid primary key default gen_random_uuid(),
  parent_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  team_group text,
  birth_year int,
  created_at timestamptz not null default now()
);
grant select, insert, update, delete on public.children to authenticated;
grant all on public.children to service_role;
alter table public.children enable row level security;
create policy "parents manage own children" on public.children for all to authenticated
  using (parent_id = auth.uid()) with check (parent_id = auth.uid());

-- Training sessions
create table public.training_sessions (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  starts_at timestamptz not null,
  ends_at timestamptz not null,
  team_group text,
  coach_name text,
  location text,
  capacity int not null default 20,
  created_at timestamptz not null default now()
);
grant select on public.training_sessions to anon, authenticated;
grant insert, update, delete on public.training_sessions to authenticated;
grant all on public.training_sessions to service_role;
alter table public.training_sessions enable row level security;
create policy "anyone can view sessions" on public.training_sessions for select to anon, authenticated using (true);
create policy "admins manage sessions" on public.training_sessions for all to authenticated
  using (public.has_role(auth.uid(), 'admin')) with check (public.has_role(auth.uid(), 'admin'));

-- Punch cards (shared per parent account)
create table public.punch_cards (
  id uuid primary key default gen_random_uuid(),
  parent_id uuid not null references auth.users(id) on delete cascade,
  total_credits int not null,
  remaining_credits int not null,
  status text not null default 'active',
  purchased_at timestamptz not null default now()
);
grant select, insert, update, delete on public.punch_cards to authenticated;
grant all on public.punch_cards to service_role;
alter table public.punch_cards enable row level security;
create policy "parents view own cards" on public.punch_cards for select to authenticated using (parent_id = auth.uid());
create policy "parents insert own cards" on public.punch_cards for insert to authenticated with check (parent_id = auth.uid());

-- Subscriptions
create table public.subscriptions (
  id uuid primary key default gen_random_uuid(),
  parent_id uuid not null references auth.users(id) on delete cascade,
  status text not null default 'active', -- active|canceled|expired
  current_period_end timestamptz,
  created_at timestamptz not null default now()
);
grant select, insert, update, delete on public.subscriptions to authenticated;
grant all on public.subscriptions to service_role;
alter table public.subscriptions enable row level security;
create policy "parents view own subs" on public.subscriptions for select to authenticated using (parent_id = auth.uid());
create policy "parents insert own subs" on public.subscriptions for insert to authenticated with check (parent_id = auth.uid());

-- Signups
create table public.signups (
  id uuid primary key default gen_random_uuid(),
  child_id uuid not null references public.children(id) on delete cascade,
  session_id uuid not null references public.training_sessions(id) on delete cascade,
  parent_id uuid not null references auth.users(id) on delete cascade,
  punch_card_id uuid references public.punch_cards(id),
  used_subscription boolean not null default false,
  created_at timestamptz not null default now(),
  unique (child_id, session_id)
);
grant select, insert, delete on public.signups to authenticated;
grant all on public.signups to service_role;
alter table public.signups enable row level security;
create policy "parents view own signups" on public.signups for select to authenticated using (parent_id = auth.uid());
create policy "parents delete own signups" on public.signups for delete to authenticated using (parent_id = auth.uid());
-- Insert is done via security-definer function below; no direct insert policy.

-- Sign-up function: atomic, picks subscription if active else decrements one punch card credit
create or replace function public.signup_child_for_session(_child_id uuid, _session_id uuid)
returns public.signups
language plpgsql
security definer
set search_path = public
as $$
declare
  _parent uuid := auth.uid();
  _card public.punch_cards%rowtype;
  _has_active_sub boolean;
  _row public.signups;
begin
  if _parent is null then raise exception 'Not authenticated'; end if;

  -- ownership check
  if not exists (select 1 from public.children where id = _child_id and parent_id = _parent) then
    raise exception 'Child not found';
  end if;

  -- prevent duplicate
  if exists (select 1 from public.signups where child_id = _child_id and session_id = _session_id) then
    raise exception 'Already signed up';
  end if;

  -- active subscription?
  select exists(
    select 1 from public.subscriptions
    where parent_id = _parent and status = 'active'
      and (current_period_end is null or current_period_end > now())
  ) into _has_active_sub;

  if _has_active_sub then
    insert into public.signups (child_id, session_id, parent_id, used_subscription)
    values (_child_id, _session_id, _parent, true)
    returning * into _row;
    return _row;
  end if;

  -- otherwise consume a punch card credit (oldest active card with credits)
  select * into _card from public.punch_cards
    where parent_id = _parent and status = 'active' and remaining_credits > 0
    order by purchased_at asc limit 1 for update;

  if not found then
    raise exception 'NO_CREDITS';
  end if;

  update public.punch_cards
    set remaining_credits = remaining_credits - 1,
        status = case when remaining_credits - 1 <= 0 then 'depleted' else 'active' end
    where id = _card.id;

  insert into public.signups (child_id, session_id, parent_id, punch_card_id, used_subscription)
  values (_child_id, _session_id, _parent, _card.id, false)
  returning * into _row;
  return _row;
end;
$$;

grant execute on function public.signup_child_for_session(uuid, uuid) to authenticated;
