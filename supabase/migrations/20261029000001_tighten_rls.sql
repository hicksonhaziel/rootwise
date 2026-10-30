-- Migration: 20261029000001_tighten_rls.sql
-- Description: Tighten RLS policies and eliminate unnecessary attack surfaces.

-- 1. Drop redundant/permissive service role chunk insert policy
drop policy if exists "service role can insert chunks" on public.source_chunks;

-- 2. Drop direct client insert policy for room_answers
-- All room answers are validated, rate-limited, and inserted exclusively via POST /api/rooms/[code] using service role
drop policy if exists "anyone can insert room answers" on public.room_answers;

-- 3. Drop unused group_contributions policies and table
drop policy if exists "users can read aggregated contributions" on public.group_contributions;
drop policy if exists "service role can insert group contributions" on public.group_contributions;
drop table if exists public.group_contributions cascade;
