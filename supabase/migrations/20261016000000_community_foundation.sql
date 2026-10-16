create table public.organizations (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique check (slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'),
  name text not null check (char_length(name) between 1 and 100),
  category text not null check (category in ('club', 'school', 'ecd', 'library', 'partner')),
  description text not null default '' check (char_length(description) <= 500),
  verified boolean not null default false,
  created_at timestamptz not null default now()
);

create table public.member_safety (
  user_id uuid primary key references auth.users(id) on delete cascade,
  consent_status text not null default 'pending'
    check (consent_status in ('pending', 'approved', 'denied')),
  reviewed_at timestamptz,
  created_at timestamptz not null default now()
);

create table public.community_posts (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete restrict,
  author_id uuid not null references auth.users(id) on delete cascade,
  body text not null check (char_length(btrim(body)) between 1 and 500),
  moderation_status text not null default 'pending'
    check (moderation_status in ('pending', 'published', 'rejected', 'removed')),
  created_at timestamptz not null default now()
);

create table public.post_comments (
  id uuid primary key default gen_random_uuid(),
  post_id uuid not null references public.community_posts(id) on delete cascade,
  author_id uuid not null references auth.users(id) on delete cascade,
  body text not null check (char_length(btrim(body)) between 1 and 300),
  moderation_status text not null default 'pending'
    check (moderation_status in ('pending', 'published', 'rejected', 'removed')),
  created_at timestamptz not null default now()
);

create table public.post_reports (
  id uuid primary key default gen_random_uuid(),
  post_id uuid not null references public.community_posts(id) on delete cascade,
  reporter_id uuid not null references auth.users(id) on delete cascade,
  reason text not null check (reason in ('safety', 'bullying', 'spam', 'other')),
  details text not null default '' check (char_length(details) <= 500),
  created_at timestamptz not null default now(),
  unique (post_id, reporter_id)
);

create index community_posts_feed_idx
  on public.community_posts (created_at desc, id)
  where moderation_status = 'published';
create index community_posts_org_feed_idx
  on public.community_posts (organization_id, created_at desc, id)
  where moderation_status = 'published';
create index community_posts_author_recent_idx
  on public.community_posts (author_id, created_at desc);
create index post_comments_feed_idx
  on public.post_comments (post_id, created_at, id)
  where moderation_status = 'published';

alter table public.organizations enable row level security;
alter table public.member_safety enable row level security;
alter table public.community_posts enable row level security;
alter table public.post_comments enable row level security;
alter table public.post_reports enable row level security;

create policy "Anyone can view verified organizations"
  on public.organizations for select
  using (verified);

create policy "Members can view their own safety status"
  on public.member_safety for select to authenticated
  using (user_id = (select auth.uid()));

create policy "Members can view published posts and their own pending posts"
  on public.community_posts for select
  using (
    (
      moderation_status = 'published'
      and exists (
        select 1 from public.organizations o
        where o.id = organization_id and o.verified
      )
    )
    or author_id = (select auth.uid())
  );

create policy "Members can view published comments and their own pending comments"
  on public.post_comments for select
  using (
    (
      moderation_status = 'published'
      and exists (
        select 1 from public.community_posts p
        join public.organizations o on o.id = p.organization_id
        where p.id = post_id
          and p.moderation_status = 'published'
          and o.verified
      )
    )
    or author_id = (select auth.uid())
  );

create policy "Members can report posts"
  on public.post_reports for insert to authenticated
  with check (reporter_id = (select auth.uid()));

create policy "Members can view their own reports"
  on public.post_reports for select to authenticated
  using (reporter_id = (select auth.uid()));

grant select on public.organizations to anon, authenticated;
grant select on public.community_posts, public.post_comments to authenticated;
grant select (id, organization_id, author_id, body, moderation_status, created_at)
  on public.community_posts to anon;
grant select (id, post_id, author_id, body, moderation_status, created_at)
  on public.post_comments to anon;
grant select on public.member_safety to authenticated;
grant select, insert on public.post_reports to authenticated;
revoke insert, update, delete, truncate, references, trigger
  on public.organizations, public.member_safety, public.community_posts,
  public.post_comments, public.post_reports
  from anon, authenticated;

create function public.create_member_safety_record()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.member_safety (user_id)
  values (new.id)
  on conflict (user_id) do nothing;
  return new;
end;
$$;

create trigger create_member_safety_after_signup
  after insert on auth.users
  for each row execute function public.create_member_safety_record();

create function public.submit_community_post(
  p_organization_id uuid,
  p_body text
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  requester uuid := auth.uid();
  new_post_id uuid;
begin
  if requester is null then
    raise exception 'Sign in is required to post';
  end if;

  if p_body is null or char_length(btrim(p_body)) not between 1 and 500 then
    raise exception 'Post must be between 1 and 500 characters';
  end if;

  if not exists (
    select 1 from public.member_safety s
    where s.user_id = requester and s.consent_status = 'approved'
  ) then
    raise exception 'Account approval is required before posting';
  end if;

  if not exists (
    select 1 from public.organizations o
    where o.id = p_organization_id and o.verified
  ) then
    raise exception 'Posts can only be sent to verified organizations';
  end if;

  if (
    select count(*) from public.community_posts p
    where p.author_id = requester
      and p.created_at > now() - interval '1 hour'
  ) >= 5 then
    raise exception 'Posting limit reached; try again later';
  end if;

  insert into public.community_posts (organization_id, author_id, body)
  values (p_organization_id, requester, btrim(p_body))
  returning id into new_post_id;

  return new_post_id;
end;
$$;

create function public.submit_post_comment(
  p_post_id uuid,
  p_body text
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  requester uuid := auth.uid();
  new_comment_id uuid;
begin
  if requester is null then
    raise exception 'Sign in is required to comment';
  end if;

  if p_body is null or char_length(btrim(p_body)) not between 1 and 300 then
    raise exception 'Comment must be between 1 and 300 characters';
  end if;

  if not exists (
    select 1 from public.member_safety s
    where s.user_id = requester and s.consent_status = 'approved'
  ) then
    raise exception 'Account approval is required before commenting';
  end if;

  if not exists (
    select 1 from public.community_posts p
    join public.organizations o on o.id = p.organization_id
    where p.id = p_post_id and p.moderation_status = 'published' and o.verified
  ) then
    raise exception 'Comments are only allowed on published posts';
  end if;

  if (
    select count(*) from public.post_comments c
    where c.author_id = requester
      and c.created_at > now() - interval '1 hour'
  ) >= 20 then
    raise exception 'Comment limit reached; try again later';
  end if;

  insert into public.post_comments (post_id, author_id, body)
  values (p_post_id, requester, btrim(p_body))
  returning id into new_comment_id;

  return new_comment_id;
end;
$$;

revoke all on function public.create_member_safety_record() from public, anon, authenticated;
revoke all on function public.submit_community_post(uuid, text) from public, anon;
revoke all on function public.submit_post_comment(uuid, text) from public, anon;
grant execute on function public.submit_community_post(uuid, text) to authenticated;
grant execute on function public.submit_post_comment(uuid, text) to authenticated;
