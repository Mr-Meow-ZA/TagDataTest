-- Complete Love Hub collaboration layer.
-- Safe to run after 001_initial_schema.sql.

create table if not exists public.love_hub_invites (
  id uuid primary key default gen_random_uuid(),
  household_id uuid not null references public.love_hub_households(id) on delete cascade,
  token_hash bytea not null unique,
  created_by uuid not null references auth.users(id) on delete cascade,
  expires_at timestamptz not null default (now() + interval '7 days'),
  used_at timestamptz,
  used_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  check (expires_at > created_at)
);

create index if not exists love_hub_invites_household_idx
  on public.love_hub_invites(household_id, created_at desc);

create unique index if not exists love_hub_members_one_household_per_user_idx
  on public.love_hub_members(user_id);

alter table public.love_hub_invites enable row level security;

drop policy if exists "love hub owners read invites" on public.love_hub_invites;
create policy "love hub owners read invites"
on public.love_hub_invites for select
to authenticated
using (public.love_hub_is_owner(household_id));

drop policy if exists "love hub owners revoke invites" on public.love_hub_invites;
create policy "love hub owners revoke invites"
on public.love_hub_invites for delete
to authenticated
using (public.love_hub_is_owner(household_id));

create or replace function public.love_hub_create_invite(target_household uuid)
returns text
language plpgsql
security definer
set search_path = public, extensions, pg_temp
as $$
declare
  raw_token text := encode(gen_random_bytes(24), 'hex');
begin
  if auth.uid() is null or not public.love_hub_is_owner(target_household) then
    raise exception 'Only a Love Hub owner can create an invitation.';
  end if;

  delete from public.love_hub_invites
  where household_id = target_household
    and (used_at is not null or expires_at <= now());

  insert into public.love_hub_invites (
    household_id,
    token_hash,
    created_by
  )
  values (
    target_household,
    digest(raw_token, 'sha256'),
    auth.uid()
  );

  return raw_token;
end;
$$;

create or replace function public.love_hub_accept_invite(
  raw_token text,
  chosen_display_name text
)
returns uuid
language plpgsql
security definer
set search_path = public, extensions, pg_temp
as $$
declare
  invite_record public.love_hub_invites%rowtype;
  clean_name text := btrim(chosen_display_name);
begin
  if auth.uid() is null then
    raise exception 'Sign in before accepting an invitation.';
  end if;

  if char_length(clean_name) < 1 or char_length(clean_name) > 80 then
    raise exception 'Choose a display name between 1 and 80 characters.';
  end if;

  if exists (
    select 1
    from public.love_hub_members
    where user_id = auth.uid()
  ) then
    raise exception 'This account already belongs to a Love Hub household.';
  end if;

  select *
  into invite_record
  from public.love_hub_invites
  where token_hash = digest(raw_token, 'sha256')
    and used_at is null
    and expires_at > now()
  for update;

  if invite_record.id is null then
    raise exception 'This invitation is invalid, expired, or already used.';
  end if;

  insert into public.love_hub_members (
    household_id,
    user_id,
    display_name,
    role
  )
  values (
    invite_record.household_id,
    auth.uid(),
    clean_name,
    'member'
  );

  update public.love_hub_invites
  set
    used_at = now(),
    used_by = auth.uid()
  where id = invite_record.id;

  return invite_record.household_id;
end;
$$;

create or replace function public.love_hub_update_display_name(chosen_display_name text)
returns void
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  clean_name text := btrim(chosen_display_name);
begin
  if auth.uid() is null then
    raise exception 'Sign in before updating your profile.';
  end if;

  if char_length(clean_name) < 1 or char_length(clean_name) > 80 then
    raise exception 'Choose a display name between 1 and 80 characters.';
  end if;

  update public.love_hub_members
  set display_name = clean_name
  where user_id = auth.uid();

  if not found then
    raise exception 'Your account is not a Love Hub member.';
  end if;
end;
$$;

revoke all on function public.love_hub_create_invite(uuid) from public;
revoke all on function public.love_hub_accept_invite(text, text) from public;
revoke all on function public.love_hub_update_display_name(text) from public;

grant execute on function public.love_hub_create_invite(uuid) to authenticated;
grant execute on function public.love_hub_accept_invite(text, text) to authenticated;
grant execute on function public.love_hub_update_display_name(text) to authenticated;

create or replace function public.love_hub_touch_updated_at()
returns trigger
language plpgsql
set search_path = public, pg_temp
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists love_hub_households_touch_updated_at on public.love_hub_households;
create trigger love_hub_households_touch_updated_at
before update on public.love_hub_households
for each row execute function public.love_hub_touch_updated_at();

drop trigger if exists love_hub_memories_touch_updated_at on public.love_hub_memories;
create trigger love_hub_memories_touch_updated_at
before update on public.love_hub_memories
for each row execute function public.love_hub_touch_updated_at();

drop trigger if exists love_hub_plans_touch_updated_at on public.love_hub_plans;
create trigger love_hub_plans_touch_updated_at
before update on public.love_hub_plans
for each row execute function public.love_hub_touch_updated_at();

drop trigger if exists love_hub_watchlist_touch_updated_at on public.love_hub_watchlist_items;
create trigger love_hub_watchlist_touch_updated_at
before update on public.love_hub_watchlist_items
for each row execute function public.love_hub_touch_updated_at();

drop trigger if exists love_hub_adventures_touch_updated_at on public.love_hub_adventures;
create trigger love_hub_adventures_touch_updated_at
before update on public.love_hub_adventures
for each row execute function public.love_hub_touch_updated_at();

do $$
declare
  table_name text;
begin
  foreach table_name in array array[
    'love_hub_memories',
    'love_hub_plans',
    'love_hub_messages',
    'love_hub_watchlist_items',
    'love_hub_adventures'
  ]
  loop
    begin
      execute format('alter publication supabase_realtime add table public.%I', table_name);
    exception
      when duplicate_object then null;
    end;
  end loop;
end;
$$;
