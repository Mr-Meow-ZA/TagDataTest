create extension if not exists pgcrypto;

create table public.households (
  id uuid primary key default gen_random_uuid(),
  name text not null default 'Rapha & Minette',
  relationship_started_on date not null default date '2025-03-15',
  created_at timestamptz not null default now()
);

create table public.household_members (
  household_id uuid not null references public.households(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  display_name text not null,
  role text not null default 'member' check (role in ('owner','member')),
  primary key (household_id,user_id)
);

create table public.memories (
  id uuid primary key default gen_random_uuid(),
  household_id uuid not null references public.households(id) on delete cascade,
  created_by uuid not null references auth.users(id),
  title text not null,
  story text,
  happened_on date,
  photo_path text,
  is_favourite boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.plans (
  id uuid primary key default gen_random_uuid(),
  household_id uuid not null references public.households(id) on delete cascade,
  created_by uuid not null references auth.users(id),
  title text not null,
  notes text,
  starts_at timestamptz,
  status text not null default 'idea' check (status in ('idea','planned','done','cancelled')),
  includes_liam boolean not null default false,
  created_at timestamptz not null default now()
);

create table public.messages (
  id uuid primary key default gen_random_uuid(),
  household_id uuid not null references public.households(id) on delete cascade,
  author_id uuid not null references auth.users(id),
  body text not null check (char_length(body) between 1 and 4000),
  opened_at timestamptz,
  created_at timestamptz not null default now()
);

create table public.watchlist_items (
  id uuid primary key default gen_random_uuid(),
  household_id uuid not null references public.households(id) on delete cascade,
  added_by uuid not null references auth.users(id),
  title text not null,
  media_type text not null check (media_type in ('movie','series')),
  status text not null default 'want_to_watch' check (status in ('want_to_watch','watching','watched')),
  rating smallint check (rating between 1 and 5),
  created_at timestamptz not null default now()
);

create table public.adventures (
  id uuid primary key default gen_random_uuid(),
  household_id uuid not null references public.households(id) on delete cascade,
  created_by uuid not null references auth.users(id),
  title text not null,
  location text,
  category text not null default 'date',
  notes text,
  completed_at timestamptz,
  created_at timestamptz not null default now()
);

create or replace function public.is_household_member(target_household uuid)
returns boolean language sql stable security definer set search_path = public
as $$ select exists(select 1 from public.household_members hm where hm.household_id = target_household and hm.user_id = auth.uid()); $$;

alter table public.households enable row level security;
alter table public.household_members enable row level security;
alter table public.memories enable row level security;
alter table public.plans enable row level security;
alter table public.messages enable row level security;
alter table public.watchlist_items enable row level security;
alter table public.adventures enable row level security;

create policy "members read household" on public.households for select using (public.is_household_member(id));
create policy "members read membership" on public.household_members for select using (public.is_household_member(household_id));

create policy "members manage memories" on public.memories for all using (public.is_household_member(household_id)) with check (public.is_household_member(household_id) and created_by = auth.uid());
create policy "members manage plans" on public.plans for all using (public.is_household_member(household_id)) with check (public.is_household_member(household_id) and created_by = auth.uid());
create policy "members manage messages" on public.messages for all using (public.is_household_member(household_id)) with check (public.is_household_member(household_id) and author_id = auth.uid());
create policy "members manage watchlist" on public.watchlist_items for all using (public.is_household_member(household_id)) with check (public.is_household_member(household_id) and added_by = auth.uid());
create policy "members manage adventures" on public.adventures for all using (public.is_household_member(household_id)) with check (public.is_household_member(household_id) and created_by = auth.uid());

insert into storage.buckets (id,name,public,file_size_limit,allowed_mime_types)
values ('love-hub-private','love-hub-private',false,10485760,array['image/jpeg','image/png','image/webp'])
on conflict (id) do nothing;

create policy "members read private photos" on storage.objects for select using (
  bucket_id = 'love-hub-private' and public.is_household_member((storage.foldername(name))[1]::uuid)
);
create policy "members upload private photos" on storage.objects for insert with check (
  bucket_id = 'love-hub-private' and public.is_household_member((storage.foldername(name))[1]::uuid)
);
