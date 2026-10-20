create table public.events (
  id uuid primary key default gen_random_uuid(),
  term_order smallint not null check (term_order > 0),
  term text not null check (length(trim(term)) > 0),
  title text not null check (length(trim(title)) > 0),
  event_date date,
  start_time time not null,
  end_time time not null,
  location text not null default '',
  description text not null default '',
  is_published boolean not null default false,
  created_at timestamptz not null default now(),
  constraint events_end_after_start check (end_time > start_time)
);

create index events_public_schedule_idx
  on public.events (term_order, event_date)
  where is_published;

create table public.league_fixtures (
  id uuid primary key default gen_random_uuid(),
  home_team text not null check (length(trim(home_team)) > 0),
  away_team text not null check (length(trim(away_team)) > 0),
  match_date date,
  kickoff_time time,
  venue text not null default '',
  home_score integer,
  away_score integer,
  is_published boolean not null default false,
  created_at timestamptz not null default now(),
  constraint league_fixture_different_teams check (home_team <> away_team),
  constraint league_fixture_nonnegative_scores check (
    (home_score is null or home_score >= 0)
    and (away_score is null or away_score >= 0)
  ),
  constraint league_fixture_scores_together check (
    (home_score is null) = (away_score is null)
  )
);

create index league_fixtures_public_schedule_idx
  on public.league_fixtures (match_date, kickoff_time)
  where is_published;

alter table public.events enable row level security;
alter table public.league_fixtures enable row level security;

revoke all on public.events, public.league_fixtures from anon, authenticated;
grant select on public.events, public.league_fixtures to anon, authenticated;

create policy "Public can read published events"
  on public.events for select to anon, authenticated
  using (is_published);

create policy "Public can read published league fixtures"
  on public.league_fixtures for select to anon, authenticated
  using (is_published);

insert into public.events (
  term_order, term, title, event_date, start_time, end_time, location, description, is_published
) values
  (1, 'Term 1', 'Big circle moment', null, '09:00', '12:00', '', 'The first Mini Circles get-together of the year.', true),
  (2, 'Term 2', 'Big circle moment', null, '09:00', '12:00', '', 'A term-time moment to read, play and celebrate together.', true),
  (3, 'Term 3', 'Big circle moment', null, '09:00', '12:00', '', 'A term-time moment to read, play and celebrate together.', true),
  (4, 'Term 4', 'Big circle moment', null, '09:00', '12:00', '', 'The last Mini Circles get-together of the year.', true);
