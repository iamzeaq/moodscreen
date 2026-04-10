-- Run in Supabase SQL Editor (Dashboard → SQL → New query)
-- Optional: mirrors auth.users for id + email (app reads email from session too)
CREATE TABLE IF NOT EXISTS public.users (
  id UUID PRIMARY KEY REFERENCES auth.users (id) ON DELETE CASCADE,
  email TEXT,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

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

CREATE POLICY "Users read own moodscreen" ON public.moodscreens
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users insert own moodscreen" ON public.moodscreens
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users update own moodscreen" ON public.moodscreens
  FOR UPDATE USING (auth.uid() = user_id);

-- Keep public.users in sync when someone signs up
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

CREATE POLICY "profiles_select_own_or_public" ON public.profiles FOR SELECT
  USING (auth.uid () = id OR username IS NOT NULL);

CREATE POLICY "profiles_insert_own" ON public.profiles FOR INSERT
  WITH CHECK (auth.uid () = id);

CREATE POLICY "profiles_update_own" ON public.profiles FOR UPDATE
  USING (auth.uid () = id);

-- Public moodscreen cards: readable when owner has chosen a username
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
