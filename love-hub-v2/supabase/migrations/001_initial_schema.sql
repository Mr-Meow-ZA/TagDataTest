create extension if not exists pgcrypto;

-- Love Hub is namespaced inside the shared rapha-personal-apps project.
-- Other applications should use their own table prefixes.

create table if not exists public.love_hub_households (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  name text not null,
  relationship_started_on date not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.love_hub_members (
  household_id uuid not null references public.love_hub_households(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  display_name text not null,
  role text not null default 'member' check (role in ('owner', 'member')),
  joined_at timestamptz not null default now(),
  primary key (household_id, user_id)
);

create table if not exists public.love_hub_memories (
  id uuid primary key default gen_random_uuid(),
  household_id uuid not null references public.love_hub_households(id) on delete cascade,
  created_by uuid not null default auth.uid() references auth.users(id),
  title text not null,
  story text,
  happened_on date,
  photo_path text,
  is_favourite boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.love_hub_plans (
  id uuid primary key default gen_random_uuid(),
  household_id uuid not null references public.love_hub_households(id) on delete cascade,
  created_by uuid not null default auth.uid() references auth.users(id),
  title text not null,
  notes text,
  location text,
  starts_at timestamptz,
  ends_at timestamptz,
  status text not null default 'idea' check (status in ('idea', 'planned', 'done', 'cancelled')),
  includes_liam boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (ends_at is null or starts_at is null or ends_at >= starts_at)
);

create table if not exists public.love_hub_messages (
  id uuid primary key default gen_random_uuid(),
  household_id uuid not null references public.love_hub_households(id) on delete cascade,
  author_id uuid not null default auth.uid() references auth.users(id),
  body text not null check (char_length(body) between 1 and 4000),
  created_at timestamptz not null default now()
);

create table if not exists public.love_hub_watchlist_items (
  id uuid primary key default gen_random_uuid(),
  household_id uuid not null references public.love_hub_households(id) on delete cascade,
  added_by uuid not null default auth.uid() references auth.users(id),
  title text not null,
  media_type text not null check (media_type in ('movie', 'series')),
  status text not null default 'want_to_watch' check (status in ('want_to_watch', 'watching', 'watched')),
  rating smallint check (rating between 1 and 5),
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.love_hub_adventures (
  id uuid primary key default gen_random_uuid(),
  household_id uuid not null references public.love_hub_households(id) on delete cascade,
  created_by uuid not null default auth.uid() references auth.users(id),
  title text not null,
  location text,
  category text not null default 'date',
  notes text,
  status text not null default 'idea' check (status in ('idea', 'planned', 'done')),
  completed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists love_hub_members_user_idx on public.love_hub_members(user_id);
create index if not exists love_hub_memories_household_idx on public.love_hub_memories(household_id, happened_on desc);
create index if not exists love_hub_plans_household_idx on public.love_hub_plans(household_id, starts_at);
create index if not exists love_hub_messages_household_idx on public.love_hub_messages(household_id, created_at desc);
create index if not exists love_hub_watchlist_household_idx on public.love_hub_watchlist_items(household_id, status);
create index if not exists love_hub_adventures_household_idx on public.love_hub_adventures(household_id, status);

create or replace function public.love_hub_is_member(target_household uuid)
returns boolean
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select exists (
    select 1
    from public.love_hub_members member
    where member.household_id = target_household
      and member.user_id = auth.uid()
  );
$$;

create or replace function public.love_hub_is_owner(target_household uuid)
returns boolean
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select exists (
    select 1
    from public.love_hub_members member
    where member.household_id = target_household
      and member.user_id = auth.uid()
      and member.role = 'owner'
  );
$$;

revoke all on function public.love_hub_is_member(uuid) from public;
revoke all on function public.love_hub_is_owner(uuid) from public;
grant execute on function public.love_hub_is_member(uuid) to authenticated;
grant execute on function public.love_hub_is_owner(uuid) to authenticated;

alter table public.love_hub_households enable row level security;
alter table public.love_hub_members enable row level security;
alter table public.love_hub_memories enable row level security;
alter table public.love_hub_plans enable row level security;
alter table public.love_hub_messages enable row level security;
alter table public.love_hub_watchlist_items enable row level security;
alter table public.love_hub_adventures enable row level security;

drop policy if exists "love hub members read household" on public.love_hub_households;
create policy "love hub members read household"
on public.love_hub_households for select
using (public.love_hub_is_member(id));

drop policy if exists "love hub owners update household" on public.love_hub_households;
create policy "love hub owners update household"
on public.love_hub_households for update
using (public.love_hub_is_owner(id))
with check (public.love_hub_is_owner(id));

drop policy if exists "love hub members read membership" on public.love_hub_members;
create policy "love hub members read membership"
on public.love_hub_members for select
using (public.love_hub_is_member(household_id));

drop policy if exists "love hub owners manage membership" on public.love_hub_members;
create policy "love hub owners manage membership"
on public.love_hub_members for all
using (public.love_hub_is_owner(household_id))
with check (public.love_hub_is_owner(household_id));

drop policy if exists "love hub members read memories" on public.love_hub_memories;
create policy "love hub members read memories"
on public.love_hub_memories for select
using (public.love_hub_is_member(household_id));

drop policy if exists "love hub members create memories" on public.love_hub_memories;
create policy "love hub members create memories"
on public.love_hub_memories for insert
with check (public.love_hub_is_member(household_id) and created_by = auth.uid());

drop policy if exists "love hub members update memories" on public.love_hub_memories;
create policy "love hub members update memories"
on public.love_hub_memories for update
using (public.love_hub_is_member(household_id))
with check (public.love_hub_is_member(household_id));

drop policy if exists "love hub members delete memories" on public.love_hub_memories;
create policy "love hub members delete memories"
on public.love_hub_memories for delete
using (public.love_hub_is_member(household_id));

drop policy if exists "love hub members read plans" on public.love_hub_plans;
create policy "love hub members read plans"
on public.love_hub_plans for select
using (public.love_hub_is_member(household_id));

drop policy if exists "love hub members create plans" on public.love_hub_plans;
create policy "love hub members create plans"
on public.love_hub_plans for insert
with check (public.love_hub_is_member(household_id) and created_by = auth.uid());

drop policy if exists "love hub members update plans" on public.love_hub_plans;
create policy "love hub members update plans"
on public.love_hub_plans for update
using (public.love_hub_is_member(household_id))
with check (public.love_hub_is_member(household_id));

drop policy if exists "love hub members delete plans" on public.love_hub_plans;
create policy "love hub members delete plans"
on public.love_hub_plans for delete
using (public.love_hub_is_member(household_id));

drop policy if exists "love hub members read messages" on public.love_hub_messages;
create policy "love hub members read messages"
on public.love_hub_messages for select
using (public.love_hub_is_member(household_id));

drop policy if exists "love hub members create messages" on public.love_hub_messages;
create policy "love hub members create messages"
on public.love_hub_messages for insert
with check (public.love_hub_is_member(household_id) and author_id = auth.uid());

drop policy if exists "love hub authors delete messages" on public.love_hub_messages;
create policy "love hub authors delete messages"
on public.love_hub_messages for delete
using (public.love_hub_is_member(household_id) and author_id = auth.uid());

drop policy if exists "love hub members read watchlist" on public.love_hub_watchlist_items;
create policy "love hub members read watchlist"
on public.love_hub_watchlist_items for select
using (public.love_hub_is_member(household_id));

drop policy if exists "love hub members create watchlist" on public.love_hub_watchlist_items;
create policy "love hub members create watchlist"
on public.love_hub_watchlist_items for insert
with check (public.love_hub_is_member(household_id) and added_by = auth.uid());

drop policy if exists "love hub members update watchlist" on public.love_hub_watchlist_items;
create policy "love hub members update watchlist"
on public.love_hub_watchlist_items for update
using (public.love_hub_is_member(household_id))
with check (public.love_hub_is_member(household_id));

drop policy if exists "love hub members delete watchlist" on public.love_hub_watchlist_items;
create policy "love hub members delete watchlist"
on public.love_hub_watchlist_items for delete
using (public.love_hub_is_member(household_id));

drop policy if exists "love hub members read adventures" on public.love_hub_adventures;
create policy "love hub members read adventures"
on public.love_hub_adventures for select
using (public.love_hub_is_member(household_id));

drop policy if exists "love hub members create adventures" on public.love_hub_adventures;
create policy "love hub members create adventures"
on public.love_hub_adventures for insert
with check (public.love_hub_is_member(household_id) and created_by = auth.uid());

drop policy if exists "love hub members update adventures" on public.love_hub_adventures;
create policy "love hub members update adventures"
on public.love_hub_adventures for update
using (public.love_hub_is_member(household_id))
with check (public.love_hub_is_member(household_id));

drop policy if exists "love hub members delete adventures" on public.love_hub_adventures;
create policy "love hub members delete adventures"
on public.love_hub_adventures for delete
using (public.love_hub_is_member(household_id));

insert into public.love_hub_households (slug, name, relationship_started_on)
values ('rapha-minette', 'Rapha & Minette', date '2025-03-15')
on conflict (slug) do nothing;

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'love-hub-private',
  'love-hub-private',
  false,
  10485760,
  array['image/jpeg', 'image/png', 'image/webp']
)
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "love hub members read private media" on storage.objects;
create policy "love hub members read private media"
on storage.objects for select
using (
  bucket_id = 'love-hub-private'
  and public.love_hub_is_member((storage.foldername(name))[1]::uuid)
);

drop policy if exists "love hub members upload private media" on storage.objects;
create policy "love hub members upload private media"
on storage.objects for insert
with check (
  bucket_id = 'love-hub-private'
  and public.love_hub_is_member((storage.foldername(name))[1]::uuid)
);

drop policy if exists "love hub members update private media" on storage.objects;
create policy "love hub members update private media"
on storage.objects for update
using (
  bucket_id = 'love-hub-private'
  and public.love_hub_is_member((storage.foldername(name))[1]::uuid)
)
with check (
  bucket_id = 'love-hub-private'
  and public.love_hub_is_member((storage.foldername(name))[1]::uuid)
);

drop policy if exists "love hub members delete private media" on storage.objects;
create policy "love hub members delete private media"
on storage.objects for delete
using (
  bucket_id = 'love-hub-private'
  and public.love_hub_is_member((storage.foldername(name))[1]::uuid)
);
