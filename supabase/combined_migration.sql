-- ============================================================================
-- Rootwise — Initial Schema Migration
-- blueprint §11: Core tables + Judges' room + Progress extensions
-- ============================================================================

-- Enable UUID generation
create extension if not exists "pgcrypto";

-- ============================================================================
-- COURSES
-- ============================================================================

create table public.courses (
  id          uuid primary key default gen_random_uuid(),
  owner_user_id uuid not null references auth.users(id) on delete cascade,
  title       text not null,
  course_code text,
  created_at  timestamptz not null default now()
);

alter table public.courses enable row level security;

create policy "owners can manage their courses"
  on public.courses for all
  using (auth.uid() = owner_user_id);

-- ============================================================================
-- COURSE MEMBERS
-- ============================================================================

create table public.course_members (
  course_id            uuid not null references public.courses(id) on delete cascade,
  user_id              uuid not null references auth.users(id) on delete cascade,
  role                 text not null default 'member' check (role in ('owner', 'member')),
  joined_at            timestamptz not null default now(),
  group_sharing_opt_in boolean not null default false,
  primary key (course_id, user_id)
);

alter table public.course_members enable row level security;

create policy "members can read their memberships"
  on public.course_members for select
  using (auth.uid() = user_id);

create policy "owners can manage memberships"
  on public.course_members for all
  using (
    exists (
      select 1 from public.courses
      where id = course_id and owner_user_id = auth.uid()
    )
  );

-- ============================================================================
-- SOURCES (uploaded PDFs / text notes)
-- ============================================================================

create table public.sources (
  id                uuid primary key default gen_random_uuid(),
  course_id         uuid not null references public.courses(id) on delete cascade,
  uploaded_by       uuid not null references auth.users(id),
  filename          text not null,
  mime_type         text not null default 'application/pdf',
  storage_path      text not null,
  processing_status text not null default 'pending'
                    check (processing_status in ('pending', 'processing', 'ready', 'error', 'scanned')),
  processing_error  text,
  page_count        int,
  created_at        timestamptz not null default now()
);

alter table public.sources enable row level security;

create policy "course members can read sources"
  on public.sources for select
  using (
    exists (
      select 1 from public.course_members
      where course_id = sources.course_id and user_id = auth.uid()
    )
    or exists (
      select 1 from public.courses
      where id = sources.course_id and owner_user_id = auth.uid()
    )
  );

create policy "course members can insert sources"
  on public.sources for insert
  with check (
    exists (
      select 1 from public.course_members
      where course_id = sources.course_id and user_id = auth.uid()
    )
    or exists (
      select 1 from public.courses
      where id = sources.course_id and owner_user_id = auth.uid()
    )
  );

-- ============================================================================
-- SOURCE CHUNKS
-- ============================================================================

create table public.source_chunks (
  id          uuid primary key default gen_random_uuid(),
  source_id   uuid not null references public.sources(id) on delete cascade,
  course_id   uuid not null references public.courses(id) on delete cascade,
  page_number int,
  chunk_index int not null,
  text        text not null,
  fts         tsvector generated always as (to_tsvector('english', text)) stored,
  created_at  timestamptz not null default now()
);

-- GIN index for full-text search
create index source_chunks_fts_idx on public.source_chunks using gin(fts);
create index source_chunks_course_idx on public.source_chunks(course_id);
create index source_chunks_source_idx on public.source_chunks(source_id);

alter table public.source_chunks enable row level security;

create policy "course members can read chunks"
  on public.source_chunks for select
  using (
    exists (
      select 1 from public.course_members
      where course_id = source_chunks.course_id and user_id = auth.uid()
    )
    or exists (
      select 1 from public.courses
      where id = source_chunks.course_id and owner_user_id = auth.uid()
    )
  );

-- Service role can insert chunks (background processing)
create policy "service role can insert chunks"
  on public.source_chunks for insert
  with check (true);

-- ============================================================================
-- TOPICS
-- ============================================================================

create table public.topics (
  id          uuid primary key default gen_random_uuid(),
  course_id   uuid not null references public.courses(id) on delete cascade,
  title       text not null,
  description text,
  created_by  text not null default 'system' check (created_by in ('system', 'user')),
  created_at  timestamptz not null default now()
);

alter table public.topics enable row level security;

create policy "course members can read topics"
  on public.topics for select
  using (
    exists (
      select 1 from public.course_members
      where course_id = topics.course_id and user_id = auth.uid()
    )
    or exists (
      select 1 from public.courses
      where id = topics.course_id and owner_user_id = auth.uid()
    )
  );

create policy "course members can manage topics"
  on public.topics for all
  using (
    exists (
      select 1 from public.courses
      where id = topics.course_id and owner_user_id = auth.uid()
    )
  );

-- ============================================================================
-- DIAGNOSTIC ATTEMPTS
-- ============================================================================

create table public.diagnostic_attempts (
  id                  uuid primary key default gen_random_uuid(),
  course_id           uuid not null references public.courses(id) on delete cascade,
  topic_id            uuid not null references public.topics(id) on delete cascade,
  user_id             uuid not null references auth.users(id) on delete cascade,
  question_text       text not null,
  student_answer      text not null,
  assessment_json     jsonb,
  citation_source_ids uuid[],
  attempt_type        text not null default 'initial'
                      check (attempt_type in ('initial', 'follow_up', 'exam_practice')),
  confidence          text not null
                      check (confidence in ('sure', 'think_so', 'guessing')),
  diagnosis_category  text
                      check (diagnosis_category in (
                        'conceptual_misconception', 'missing_prerequisite',
                        'procedural_gap', 'calculation_or_execution_error',
                        'partially_correct', 'insufficient_evidence', 'appears_correct'
                      )),
  assessment          text
                      check (assessment in ('correct', 'partial', 'incorrect', 'insufficient')),
  diagnosis_rejected  boolean not null default false,
  confident_error     boolean not null default false,
  created_at          timestamptz not null default now()
);

create index diagnostic_attempts_user_topic_idx
  on public.diagnostic_attempts(user_id, topic_id);
create index diagnostic_attempts_course_idx
  on public.diagnostic_attempts(course_id);

alter table public.diagnostic_attempts enable row level security;

create policy "users can manage their own attempts"
  on public.diagnostic_attempts for all
  using (auth.uid() = user_id);

-- ============================================================================
-- TOPIC PROGRESS
-- ============================================================================

create table public.topic_progress (
  user_id          uuid not null references auth.users(id) on delete cascade,
  course_id        uuid not null references public.courses(id) on delete cascade,
  topic_id         uuid not null references public.topics(id) on delete cascade,
  status           text not null default 'not_assessed'
                   check (status in ('not_assessed', 'needs_work', 'developing', 'demonstrated')),
  status_reason    text,
  confident_error  boolean not null default false,
  recheck_due_at   timestamptz,
  last_attempt_at  timestamptz,
  updated_at       timestamptz not null default now(),
  primary key (user_id, topic_id)
);

create index topic_progress_course_idx on public.topic_progress(course_id);

alter table public.topic_progress enable row level security;

create policy "users can manage their own progress"
  on public.topic_progress for all
  using (auth.uid() = user_id);

-- ============================================================================
-- GROUP CONTRIBUTIONS (opt-in, anonymised)
-- ============================================================================

create table public.group_contributions (
  id                  uuid primary key default gen_random_uuid(),
  course_id           uuid not null references public.courses(id) on delete cascade,
  topic_id            uuid references public.topics(id) on delete set null,
  user_id             uuid not null references auth.users(id) on delete cascade,
  contribution_type   text not null,
  misconception_cat   text,
  consented_at        timestamptz not null default now(),
  created_at          timestamptz not null default now()
);

alter table public.group_contributions enable row level security;

create policy "users can insert their own contributions"
  on public.group_contributions for insert
  with check (auth.uid() = user_id);

create policy "users can read aggregated contributions"
  on public.group_contributions for select
  using (true);

-- ============================================================================
-- JUDGES' ROOM (§3.2 / FR-22)
-- ============================================================================

create table public.room_sessions (
  id            uuid primary key default gen_random_uuid(),
  host_user_id  uuid not null references auth.users(id),
  code          text not null unique,
  course_id     uuid references public.courses(id) on delete set null,
  question_text text not null,
  is_active     boolean not null default true,
  created_at    timestamptz not null default now()
);

create index room_sessions_code_idx on public.room_sessions(code);

alter table public.room_sessions enable row level security;

create policy "anyone can read active rooms"
  on public.room_sessions for select
  using (is_active = true);

create policy "host can manage their rooms"
  on public.room_sessions for all
  using (auth.uid() = host_user_id);

create table public.room_answers (
  id            uuid primary key default gen_random_uuid(),
  room_id       uuid not null references public.room_sessions(id) on delete cascade,
  -- No user_id link — answers are anonymous. A session token prevents duplicates.
  session_token text not null,
  opted_in      boolean not null default false,
  confidence    text check (confidence in ('sure', 'think_so', 'guessing')),
  misconception_cat text,
  created_at    timestamptz not null default now(),
  unique (room_id, session_token)
);

create index room_answers_room_idx on public.room_answers(room_id);

alter table public.room_answers enable row level security;

create policy "anyone can insert room answers"
  on public.room_answers for insert
  with check (true);

create policy "host can read room answers"
  on public.room_answers for select
  using (
    exists (
      select 1 from public.room_sessions rs
      where rs.id = room_id and rs.host_user_id = auth.uid()
    )
  );

-- Enable Realtime for live room updates (host view)
alter publication supabase_realtime add table public.room_answers;

-- ============================================================================
-- FIX TUNDE sessions (§5.4 S5)
-- ============================================================================

create table public.fix_tunde_sessions (
  id                          uuid primary key default gen_random_uuid(),
  user_id                     uuid not null references auth.users(id) on delete cascade,
  topic_id                    uuid not null references public.topics(id) on delete cascade,
  explanation_with_misconception text not null,
  planted_misconception_hint  text not null,
  correct_version             text not null,
  student_fix                 text,
  fix_result                  text check (fix_result in ('correct', 'missed', 'partial')),
  created_at                  timestamptz not null default now()
);

alter table public.fix_tunde_sessions enable row level security;

create policy "users manage their own fix-tunde sessions"
  on public.fix_tunde_sessions for all
  using (auth.uid() = user_id);
-- Storage bucket for source files
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'sources',
  'sources',
  false,
  52428800,  -- 50MB limit
  array['application/pdf', 'text/plain']
)
on conflict (id) do nothing;

-- RLS: only course members can upload
create policy "course members can upload sources"
  on storage.objects for insert
  with check (bucket_id = 'sources' and auth.uid() is not null);

-- RLS: authenticated users can read their own uploads
create policy "users can read source files"
  on storage.objects for select
  using (bucket_id = 'sources' and auth.uid() is not null);

create policy "users can delete their own source files"
  on storage.objects for delete
  using (bucket_id = 'sources' and auth.uid() is not null);
