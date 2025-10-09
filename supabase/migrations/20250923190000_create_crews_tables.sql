-- Create crews and crew_members to differentiate from teams
create table if not exists public.crews (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  description text,
  leader_id uuid not null references auth.users(id) on delete set null,
  max_members int not null default 100 check (max_members > 0),
  created_at timestamptz not null default now()
);

create table if not exists public.crew_members (
  id uuid primary key default gen_random_uuid(),
  crew_id uuid not null references public.crews(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  role text not null default 'member',
  joined_at timestamptz not null default now(),
  unique (crew_id, user_id)
);

-- Enable RLS
alter table public.crews enable row level security;
alter table public.crew_members enable row level security;

-- Policies: read all crews; members can read membership; users can create crews and join/leave themselves
create policy if not exists "Crews are viewable by everyone"
on public.crews for select using (true);

create policy if not exists "Authenticated users can create crews"
on public.crews for insert to authenticated with check (auth.uid() is not null);

create policy if not exists "Crew members and public can view memberships"
on public.crew_members for select using (true);

create policy if not exists "Users can join crews"
on public.crew_members for insert to authenticated with check (auth.uid() = user_id);

create policy if not exists "Users can leave their own crew memberships"
on public.crew_members for delete to authenticated using (auth.uid() = user_id);

-- Helpful indexes
create index if not exists idx_crew_members_user on public.crew_members(user_id);
create index if not exists idx_crew_members_crew on public.crew_members(crew_id);

