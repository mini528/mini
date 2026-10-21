create table public.stakeholder_profiles (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  name text not null check (length(trim(name)) > 0),
  category text not null default '',
  tagline text not null default '',
  description text not null default '',
  logo_url text not null default '',
  banner_url text not null default '',
  website_url text not null default '',
  contact_email text not null default '',
  contact_phone text not null default '',
  programmes jsonb not null default '[]'::jsonb check (jsonb_typeof(programmes) = 'array'),
  news jsonb not null default '[]'::jsonb check (jsonb_typeof(news) = 'array'),
  gallery jsonb not null default '[]'::jsonb check (jsonb_typeof(gallery) = 'array'),
  is_published boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.stakeholder_memberships (
  user_id uuid not null references auth.users(id) on delete cascade,
  stakeholder_id uuid not null references public.stakeholder_profiles(id) on delete cascade,
  role text not null check (role in ('owner', 'editor', 'viewer')),
  created_at timestamptz not null default now(),
  primary key (user_id, stakeholder_id)
);

insert into public.stakeholder_profiles (
  slug, name, category, tagline, description, is_published
) values
  (
    'reading-materials-trust',
    'Reading Materials Trust',
    'Reading',
    'Book distribution and library supply partnership.',
    'Supporting access to reading materials and library supplies.',
    true
  ),
  (
    'sunrise-creche',
    'Sunrise Creche',
    'Early Learning',
    'Early learning, big futures.',
    'An early-learning partner supporting young children and their communities.',
    true
  ),
  (
    'township-sports-council',
    'Township Sports Council',
    'Sport',
    'Coaching facilities and match fixtures.',
    'A community sports partner supporting coaching access and match opportunities.',
    true
  )
on conflict (slug) do nothing;

create index stakeholder_profiles_public_directory_idx
  on public.stakeholder_profiles (category, name)
  where is_published;

create index stakeholder_memberships_user_idx
  on public.stakeholder_memberships (user_id);

create or replace function public.set_stakeholder_profile_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger stakeholder_profiles_set_updated_at
  before update on public.stakeholder_profiles
  for each row execute function public.set_stakeholder_profile_updated_at();

alter table public.stakeholder_profiles enable row level security;
alter table public.stakeholder_memberships enable row level security;

revoke all on public.stakeholder_profiles, public.stakeholder_memberships from anon, authenticated;
grant select on public.stakeholder_profiles to anon, authenticated;
grant update (
  name,
  category,
  tagline,
  description,
  logo_url,
  banner_url,
  website_url,
  contact_email,
  contact_phone,
  programmes,
  news,
  gallery
) on public.stakeholder_profiles to authenticated;
grant select on public.stakeholder_memberships to authenticated;

create policy "Public can read published stakeholder profiles"
  on public.stakeholder_profiles for select to anon, authenticated
  using (is_published);

create policy "Members can read their stakeholder profiles"
  on public.stakeholder_profiles for select to authenticated
  using (
    exists (
      select 1
      from public.stakeholder_memberships membership
      where membership.stakeholder_id = stakeholder_profiles.id
        and membership.user_id = (select auth.uid())
    )
  );

create policy "Stakeholder editors can update their profile"
  on public.stakeholder_profiles for update to authenticated
  using (
    exists (
      select 1
      from public.stakeholder_memberships membership
      where membership.stakeholder_id = stakeholder_profiles.id
        and membership.user_id = (select auth.uid())
        and membership.role in ('owner', 'editor')
    )
  )
  with check (
    exists (
      select 1
      from public.stakeholder_memberships membership
      where membership.stakeholder_id = stakeholder_profiles.id
        and membership.user_id = (select auth.uid())
        and membership.role in ('owner', 'editor')
    )
  );

create policy "Users can read their stakeholder memberships"
  on public.stakeholder_memberships for select to authenticated
  using (user_id = (select auth.uid()));

insert into storage.buckets (
  id, name, public, file_size_limit, allowed_mime_types
) values (
  'stakeholder-media',
  'stakeholder-media',
  true,
  10485760,
  array['image/jpeg', 'image/png', 'image/webp']
)
on conflict (id) do update
set public = excluded.public,
    file_size_limit = excluded.file_size_limit,
    allowed_mime_types = excluded.allowed_mime_types;

create policy "Public can view published stakeholder media"
  on storage.objects for select to anon, authenticated
  using (
    bucket_id = 'stakeholder-media'
    and exists (
      select 1
      from public.stakeholder_profiles profile
      where profile.id::text = split_part(storage.objects.name, '/', 1)
        and profile.is_published
    )
  );

create policy "Stakeholder members can view their media"
  on storage.objects for select to authenticated
  using (
    bucket_id = 'stakeholder-media'
    and exists (
      select 1
      from public.stakeholder_profiles profile
      join public.stakeholder_memberships membership
        on membership.stakeholder_id = profile.id
      where profile.id::text = split_part(storage.objects.name, '/', 1)
        and membership.user_id = (select auth.uid())
    )
  );

create policy "Stakeholder editors can upload media"
  on storage.objects for insert to authenticated
  with check (
    bucket_id = 'stakeholder-media'
    and exists (
      select 1
      from public.stakeholder_memberships membership
      where membership.stakeholder_id::text = split_part(storage.objects.name, '/', 1)
        and membership.user_id = (select auth.uid())
        and membership.role in ('owner', 'editor')
    )
  );

create policy "Stakeholder editors can update media"
  on storage.objects for update to authenticated
  using (
    bucket_id = 'stakeholder-media'
    and exists (
      select 1
      from public.stakeholder_memberships membership
      where membership.stakeholder_id::text = split_part(storage.objects.name, '/', 1)
        and membership.user_id = (select auth.uid())
        and membership.role in ('owner', 'editor')
    )
  )
  with check (
    bucket_id = 'stakeholder-media'
    and exists (
      select 1
      from public.stakeholder_memberships membership
      where membership.stakeholder_id::text = split_part(storage.objects.name, '/', 1)
        and membership.user_id = (select auth.uid())
        and membership.role in ('owner', 'editor')
    )
  );

create policy "Stakeholder editors can delete media"
  on storage.objects for delete to authenticated
  using (
    bucket_id = 'stakeholder-media'
    and exists (
      select 1
      from public.stakeholder_memberships membership
      where membership.stakeholder_id::text = split_part(storage.objects.name, '/', 1)
        and membership.user_id = (select auth.uid())
        and membership.role in ('owner', 'editor')
    )
  );
