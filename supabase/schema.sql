-- Run in Supabase SQL Editor (Dashboard → SQL → New query).
--
-- **This file is safe to re-run.** Every statement is idempotent, so running it
-- against a database that already has some of these objects updates them rather
-- than erroring partway through and leaving the rest uncreated.
--
-- Postgres has no CREATE POLICY IF NOT EXISTS, so every policy is preceded by a
-- DROP POLICY IF EXISTS. Same for the view and for pulse_by_mood: CREATE OR
-- REPLACE refuses a changed column list or return type, so both are dropped
-- first and recreated. That is the whole trick — there is nothing to remember
-- when editing this file except to keep each new object in the same shape.

-- Optional: mirrors auth.users for id + email (app reads email from session too)
CREATE TABLE IF NOT EXISTS public.users (
  id UUID PRIMARY KEY REFERENCES auth.users (id) ON DELETE CASCADE,
  email TEXT,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users read self" ON public.users;

CREATE POLICY "Users read self" ON public.users
  FOR SELECT USING (auth.uid() = id);

-- Moodscreen JSON per authenticated user (one row per user)
CREATE TABLE IF NOT EXISTS public.moodscreens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid (),
  user_id UUID NOT NULL REFERENCES auth.users (id) ON DELETE CASCADE,
  data JSONB NOT NULL DEFAULT '{}'::JSONB,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (user_id)
);

CREATE INDEX IF NOT EXISTS moodscreens_user_id_idx ON public.moodscreens (user_id);

ALTER TABLE public.moodscreens ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users read own moodscreen" ON public.moodscreens;

CREATE POLICY "Users read own moodscreen" ON public.moodscreens
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users insert own moodscreen" ON public.moodscreens;

CREATE POLICY "Users insert own moodscreen" ON public.moodscreens
  FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users update own moodscreen" ON public.moodscreens;

CREATE POLICY "Users update own moodscreen" ON public.moodscreens
  FOR UPDATE USING (auth.uid() = user_id);

-- Keep public.users in sync when someone signs up.
--
-- CREATE OR REPLACE here, not the drop-and-recreate used for the view and for
-- pulse_by_mood below. A trigger function's return type is `trigger` and cannot
-- become anything else, so REPLACE can never hit the changed-signature error
-- those two are guarded against — and dropping it would fail outright if any
-- trigger anywhere still depended on it, which is exactly the partway failure
-- this file exists to avoid.
CREATE OR REPLACE FUNCTION public.handle_new_user ()
  RETURNS TRIGGER
  LANGUAGE plpgsql
  SECURITY DEFINER
  SET search_path = public
  AS $$
BEGIN
  INSERT INTO public.users (id, email)
    VALUES (NEW.id, NEW.email)
  ON CONFLICT (id)
    DO UPDATE SET
      email = EXCLUDED.email,
      updated_at = NOW();
  RETURN NEW;
END;
$$;

-- CREATE TRIGGER has no IF NOT EXISTS, so this pair is the idempotent form.
-- Dropping the trigger is safe in a way that dropping its function is not:
-- nothing depends on a trigger.
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE PROCEDURE public.handle_new_user ();

-- Public profile slug + presence (optional; app creates row on first login)
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users (id) ON DELETE CASCADE,
  username TEXT UNIQUE,
  location TEXT,
  last_active TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS profiles_username_idx ON public.profiles (username)
WHERE
  username IS NOT NULL;

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "profiles_select_own_or_public" ON public.profiles;

CREATE POLICY "profiles_select_own_or_public" ON public.profiles FOR SELECT
  USING (auth.uid () = id OR username IS NOT NULL);

DROP POLICY IF EXISTS "profiles_insert_own" ON public.profiles;

CREATE POLICY "profiles_insert_own" ON public.profiles FOR INSERT
  WITH CHECK (auth.uid () = id);

DROP POLICY IF EXISTS "profiles_update_own" ON public.profiles;

CREATE POLICY "profiles_update_own" ON public.profiles FOR UPDATE
  USING (auth.uid () = id);

-- Public moodscreen cards: readable when owner has chosen a username
DROP POLICY IF EXISTS "moodscreens_select_public_profile" ON public.moodscreens;

CREATE POLICY "moodscreens_select_public_profile" ON public.moodscreens FOR SELECT
  USING (
    EXISTS (
      SELECT 1
      FROM public.profiles p
      WHERE
        p.id = moodscreens.user_id
        AND p.username IS NOT NULL
    )
  );

-- One query for the public page, not two.
--
-- §11: "The public profile does two sequential Supabase round-trips. Join them
-- — this is the page shared links land on." The client could not do it on its
-- own: moodscreens has no foreign key to profiles (both point at auth.users),
-- so PostgREST cannot embed one in the other, and the page had to fetch the
-- profile, wait, then fetch the Moodscreen with the id it came back with. On a
-- phone opening a link from a story that is two serial round-trips before
-- anything at all is drawn. The join belongs in the database, same as the
-- wall's.
--
-- LEFT JOIN, not INNER: claiming a page and writing a Moodscreen are two acts
-- and the first can stand without the second. An inner join would make a page
-- claimed a minute ago read as "this profile doesn't exist", which is the worst
-- possible answer to someone who just claimed it.
--
-- Deliberately not security_invoker, matching wall_moodscreens: the view runs
-- with its owner's rights and its WHERE clause is the whole access rule. It
-- exposes exactly the rows whose owner claimed a page — the same set the
-- existing profiles and moodscreens policies already make public, so this adds
-- no reach, only one round-trip less.
DROP VIEW IF EXISTS public.public_moodscreens;

--
-- `user_id` is here for the link preview: api/og-page.js builds the image URL
-- og/{user_id}.jpg from it. It adds no reach either — profiles_select_own_or_public
-- already exposes the id of every claimed profile.
CREATE VIEW public.public_moodscreens AS
SELECT
  p.id AS user_id,
  p.username,
  p.location,
  p.last_active,
  m.data,
  m.updated_at
FROM public.profiles p
  LEFT JOIN public.moodscreens m ON m.user_id = p.id
WHERE
  p.username IS NOT NULL;

GRANT SELECT ON public.public_moodscreens TO anon, authenticated;

-- ---------------------------------------------------------------------------
-- The wall (CLAUDE.md §9.3) and the pulse (§9.2)
-- ---------------------------------------------------------------------------
-- Appearing on the wall is opt-in and defaults to off.
--
-- This is a separate fact from having claimed a page, and the two must not be
-- collapsed into one. Claiming moodscreen.live/name publishes that page — that
-- is what claiming *is*, and the policy above is right to gate on it. Being
-- pulled into a scrolling row on the front page is a different ask, so it gets
-- its own flag rather than riding on the username.
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS wall_public BOOLEAN NOT NULL DEFAULT FALSE;

-- One query for the wall, not two.
--
-- §11 flags the public profile's two sequential round-trips as a known problem,
-- and the wall would have had the same shape: moodscreens has no foreign key to
-- profiles (both point at auth.users), so PostgREST cannot embed one in the
-- other and the client would have had to fetch rows and then names. The join
-- belongs in the database.
--
-- Deliberately not security_invoker: the view runs with its owner's rights and
-- its WHERE clause is the whole access rule. It exposes exactly the rows whose
-- owner claimed a page AND opted into the wall, and only the four columns the
-- wall draws.
--
-- Dropped and recreated rather than CREATE OR REPLACE, which refuses any change
-- to the column list — so adding a column to the wall later would fail here
-- instead of applying.
DROP VIEW IF EXISTS public.wall_moodscreens;

CREATE VIEW public.wall_moodscreens AS
SELECT
  p.username,
  p.location,
  m.data,
  m.updated_at
FROM public.moodscreens m
  JOIN public.profiles p ON p.id = m.user_id
WHERE
  p.username IS NOT NULL
  AND p.wall_public;

GRANT SELECT ON public.wall_moodscreens TO anon, authenticated;

-- Seeded Moodscreens for the wall.
--
-- §9.3: an empty wall is worse than no wall. These are examples, they are
-- authored in src/lib/wallSeeds.js, and supabase/seed-wall.sql is generated
-- from that file — never hand-edited here.
--
-- They are kept apart from real rows rather than inserted as fake users for two
-- reasons: moodscreens.user_id is a foreign key to auth.users, so seeding it
-- would mean thirty fabricated accounts; and when the wall fills with real
-- Moodscreens this table is dropped in one statement with nothing else to
-- unpick.
CREATE TABLE IF NOT EXISTS public.wall_seeds (
  username TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  location TEXT NOT NULL DEFAULT '',
  -- The v3 payload, so seeds read through normalizeStoredMoodscreen exactly as
  -- stored Moodscreens do and the wall has one code path.
  data JSONB NOT NULL,
  sort_order INT NOT NULL DEFAULT 0
);

ALTER TABLE public.wall_seeds ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "wall_seeds_select_all" ON public.wall_seeds;

-- Readable by anyone; writable by nobody holding the anon key. Seeds are
-- loaded from the SQL editor or the service role, never from the app.
CREATE POLICY "wall_seeds_select_all" ON public.wall_seeds FOR SELECT
  USING (TRUE);

-- §9.2 — the pulse: one aggregate, counting Moodscreens by mood.
--
-- SECURITY DEFINER because it has to see rows the caller cannot: the count is
-- the whole platform, not the caller's own row and not the wall-public subset.
-- What it returns is ten integers, so it discloses scale and nothing about any
-- person — no id, no handle, no statement.
--
-- `window_hours` is the freshness rule, and it is deliberately NULL by default:
-- what counts as a *live* Moodscreen is an open product decision, so today this
-- counts every one. When that is settled the answer lands here and in
-- PULSE_WINDOW_HOURS on the client, and nothing else moves.
--
-- Dropped first for the same reason as the view: CREATE OR REPLACE cannot
-- change a function's return type, and this one returns a table whose shape is
-- exactly what a freshness rule might alter.
DROP FUNCTION IF EXISTS public.pulse_by_mood (INT);

CREATE FUNCTION public.pulse_by_mood (window_hours INT DEFAULT NULL)
  RETURNS TABLE (
    mood_id TEXT,
    total BIGINT
  )
  LANGUAGE sql
  STABLE
  SECURITY DEFINER
  SET search_path = public
  AS $$
  SELECT
    COALESCE(NULLIF(m.data ->> 'mood', ''), 'thinking') AS mood_id,
    COUNT(*)::BIGINT AS total
  FROM public.moodscreens m
  WHERE
    window_hours IS NULL
    OR m.updated_at > NOW() - (window_hours || ' hours')::INTERVAL
  GROUP BY 1;
$$;

GRANT EXECUTE ON FUNCTION public.pulse_by_mood (INT) TO anon, authenticated;

-- ---------------------------------------------------------------------------
-- Link previews
-- ---------------------------------------------------------------------------
-- og/{user_id}.jpg — the 1200x630 image a pasted moodscreen.live/username link
-- unfurls to. Captured in the browser on save (MoodscreenContext) and served as
-- og:image by api/og-page.js.
--
-- Public, because crawlers fetch it with no credentials at all. Capped at
-- 300kB and JPEG only: the client already keeps it under WhatsApp's preview
-- limit, and the cap makes that a rule rather than a habit.
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('og', 'og', TRUE, 307200, ARRAY['image/jpeg'])
ON CONFLICT (id) DO UPDATE SET
  public = EXCLUDED.public,
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

-- Each user writes exactly one object, named for themselves, and nothing else.
-- SELECT is needed as well as INSERT and UPDATE because an upsert reads the
-- existing object first; reading through the public URL needs no policy.
DROP POLICY IF EXISTS "og_select_own" ON storage.objects;

CREATE POLICY "og_select_own" ON storage.objects FOR SELECT TO authenticated
  USING (bucket_id = 'og' AND name = (SELECT auth.uid ())::TEXT || '.jpg');

DROP POLICY IF EXISTS "og_insert_own" ON storage.objects;

CREATE POLICY "og_insert_own" ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'og' AND name = (SELECT auth.uid ())::TEXT || '.jpg');

DROP POLICY IF EXISTS "og_update_own" ON storage.objects;

CREATE POLICY "og_update_own" ON storage.objects FOR UPDATE TO authenticated
  USING (bucket_id = 'og' AND name = (SELECT auth.uid ())::TEXT || '.jpg')
  WITH CHECK (bucket_id = 'og' AND name = (SELECT auth.uid ())::TEXT || '.jpg');
