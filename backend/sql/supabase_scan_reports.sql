create extension if not exists pgcrypto;

-- ======================================================
-- Project-normalized schema: full scan storage
-- ======================================================

create table if not exists public.scan_runs (
  id uuid primary key default gen_random_uuid(),
  source_url text not null,
  pages_scanned int4 not null,
  total_issues int4 not null,
  score int4 not null,
  request_id text,
  status text not null default 'completed',
  duration_ms int4,
  timings jsonb,
  summary jsonb,
  meta jsonb,
  scanned_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);

create table if not exists public.scan_pages (
  id uuid primary key default gen_random_uuid(),
  run_id uuid not null references public.scan_runs(id) on delete cascade,
  page_url text not null,
  issues_count int4 not null default 0,
  created_at timestamptz not null default now()
);

create table if not exists public.scan_issues (
  id uuid primary key default gen_random_uuid(),
  run_id uuid not null references public.scan_runs(id) on delete cascade,
  page_id uuid references public.scan_pages(id) on delete cascade,
  page_url text,
  issue text not null,
  severity text,
  html text,
  target text,
  description text,
  explanation text,
  impact text,
  fix text,
  raw jsonb,
  created_at timestamptz not null default now()
);

create index if not exists idx_scan_runs_scanned_at on public.scan_runs(scanned_at desc);
create index if not exists idx_scan_runs_score on public.scan_runs(score);
create index if not exists idx_scan_pages_run_id on public.scan_pages(run_id);
create index if not exists idx_scan_issues_run_id on public.scan_issues(run_id);
create index if not exists idx_scan_issues_page_id on public.scan_issues(page_id);
create index if not exists idx_scan_issues_severity on public.scan_issues(severity);

alter table public.scan_runs enable row level security;
alter table public.scan_pages enable row level security;
alter table public.scan_issues enable row level security;

-- Optional: anon policies (needed only if backend uses anon key).
do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'scan_runs' and policyname = 'anon_insert_scan_runs'
  ) then
    create policy anon_insert_scan_runs
      on public.scan_runs
      for insert
      to anon
      with check (true);
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'scan_runs' and policyname = 'anon_select_scan_runs'
  ) then
    create policy anon_select_scan_runs
      on public.scan_runs
      for select
      to anon
      using (true);
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'scan_pages' and policyname = 'anon_insert_scan_pages'
  ) then
    create policy anon_insert_scan_pages
      on public.scan_pages
      for insert
      to anon
      with check (true);
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'scan_pages' and policyname = 'anon_select_scan_pages'
  ) then
    create policy anon_select_scan_pages
      on public.scan_pages
      for select
      to anon
      using (true);
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'scan_issues' and policyname = 'anon_insert_scan_issues'
  ) then
    create policy anon_insert_scan_issues
      on public.scan_issues
      for insert
      to anon
      with check (true);
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'scan_issues' and policyname = 'anon_select_scan_issues'
  ) then
    create policy anon_select_scan_issues
      on public.scan_issues
      for select
      to anon
      using (true);
  end if;
end $$;

-- ======================================================
-- Existing legacy table (public.scans)
-- Keep as-is if your app still uses it.
-- Backend auto mode will fallback to this table when
-- normalized tables are unavailable.
-- ======================================================
