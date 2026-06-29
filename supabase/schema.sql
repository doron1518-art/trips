-- ================================================================
-- TRIPS APP — COMPLETE SUPABASE SCHEMA
-- Run this once in: Supabase Dashboard → SQL Editor → New Query
-- ================================================================


-- ── 0. EXTENSIONS ───────────────────────────────────────────────
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";


-- ================================================================
-- TABLES
-- ================================================================

-- ── 1. PROFILES ─────────────────────────────────────────────────
-- Mirrors auth.users. Auto-populated via trigger on signup.
CREATE TABLE IF NOT EXISTS public.profiles (
  id          UUID        PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email       TEXT        NOT NULL,
  full_name   TEXT,
  avatar_url  TEXT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ── 2. TRIPS ────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.trips (
  id               UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
  owner_id         UUID        NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  title            TEXT        NOT NULL,
  description      TEXT,
  destination      TEXT,
  start_date       DATE,
  end_date         DATE,
  cover_image_url  TEXT,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ── 3. TRIP MEMBERS ─────────────────────────────────────────────
-- Every collaborator (including the owner) has a row here.
-- Role 'owner' is inserted automatically by trigger (see below).
-- Role 'editor' is created when an owner invites another user.
CREATE TABLE IF NOT EXISTS public.trip_members (
  id          UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
  trip_id     UUID        NOT NULL REFERENCES public.trips(id)    ON DELETE CASCADE,
  user_id     UUID        NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  role        TEXT        NOT NULL DEFAULT 'editor'
                          CHECK (role IN ('owner', 'editor')),
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (trip_id, user_id)
);

-- ── 4. ITINERARY ITEMS ──────────────────────────────────────────
-- One row per "anchor" (event, hotel, transit, etc.) on the timeline.
CREATE TABLE IF NOT EXISTS public.itinerary_items (
  id           UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
  trip_id      UUID        NOT NULL REFERENCES public.trips(id)    ON DELETE CASCADE,
  created_by   UUID        NOT NULL REFERENCES public.profiles(id),
  date         DATE        NOT NULL,
  title        TEXT        NOT NULL,
  type         TEXT        NOT NULL DEFAULT 'event'
                           CHECK (type IN ('event', 'hotel', 'transit', 'other', 'concert', 'tour')),
  description  TEXT,
  location     TEXT,
  time         TIME,
  sort_order   INTEGER     NOT NULL DEFAULT 0,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ── 5. IDEAS ────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.ideas (
  id           UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
  trip_id      UUID        NOT NULL REFERENCES public.trips(id)    ON DELETE CASCADE,
  created_by   UUID        NOT NULL REFERENCES public.profiles(id),
  name         TEXT        NOT NULL,
  description  TEXT,
  category     TEXT        NOT NULL DEFAULT 'other'
                           CHECK (category IN
                             ('food','music','culture','nature','adventure','shopping','other')),
  image_url    TEXT,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ── 6. DIARY ENTRIES ────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.diary_entries (
  id          UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
  trip_id     UUID        NOT NULL REFERENCES public.trips(id)    ON DELETE CASCADE,
  created_by  UUID        NOT NULL REFERENCES public.profiles(id),
  date        DATE        NOT NULL,
  notes       TEXT,
  photo_urls  TEXT[]      NOT NULL DEFAULT '{}',
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);


-- ================================================================
-- INDEXES
-- ================================================================
CREATE INDEX IF NOT EXISTS idx_trip_members_user   ON public.trip_members    (user_id);
CREATE INDEX IF NOT EXISTS idx_trip_members_trip   ON public.trip_members    (trip_id);
CREATE INDEX IF NOT EXISTS idx_itinerary_trip_date ON public.itinerary_items (trip_id, date, sort_order);
CREATE INDEX IF NOT EXISTS idx_ideas_trip          ON public.ideas           (trip_id, created_at);
CREATE INDEX IF NOT EXISTS idx_diary_trip_date     ON public.diary_entries   (trip_id, date);


-- ================================================================
-- FUNCTIONS & TRIGGERS
-- ================================================================

-- ── Auto-create profile row when a new auth user signs up ───────
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, avatar_url)
  VALUES (
    NEW.id,
    NEW.email,
    NEW.raw_user_meta_data->>'full_name',
    NEW.raw_user_meta_data->>'avatar_url'
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ── Auto-insert owner into trip_members on trip creation ────────
CREATE OR REPLACE FUNCTION public.handle_new_trip()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.trip_members (trip_id, user_id, role)
  VALUES (NEW.id, NEW.owner_id, 'owner');
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_trip_created ON public.trips;
CREATE TRIGGER on_trip_created
  AFTER INSERT ON public.trips
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_trip();

-- ── Keep updated_at current ─────────────────────────────────────
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_trips_updated_at         ON public.trips;
DROP TRIGGER IF EXISTS trg_itinerary_updated_at     ON public.itinerary_items;
DROP TRIGGER IF EXISTS trg_ideas_updated_at         ON public.ideas;
DROP TRIGGER IF EXISTS trg_diary_entries_updated_at ON public.diary_entries;

CREATE TRIGGER trg_trips_updated_at
  BEFORE UPDATE ON public.trips
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TRIGGER trg_itinerary_updated_at
  BEFORE UPDATE ON public.itinerary_items
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TRIGGER trg_ideas_updated_at
  BEFORE UPDATE ON public.ideas
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TRIGGER trg_diary_entries_updated_at
  BEFORE UPDATE ON public.diary_entries
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ── Helper: is the current auth user a member of a given trip? ──
-- SECURITY DEFINER avoids RLS recursion (trip_members checks itself).
CREATE OR REPLACE FUNCTION public.is_trip_member(p_trip_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.trip_members
    WHERE trip_id = p_trip_id
      AND user_id = auth.uid()
  );
$$;


-- ================================================================
-- ROW LEVEL SECURITY
-- ================================================================

-- ── profiles ────────────────────────────────────────────────────
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- A user can read their own profile or any profile that shares a trip with them
CREATE POLICY "profiles: read own or co-members"
  ON public.profiles FOR SELECT
  USING (
    id = auth.uid()
    OR EXISTS (
      SELECT 1
      FROM public.trip_members tm1
      JOIN public.trip_members tm2 ON tm1.trip_id = tm2.trip_id
      WHERE tm1.user_id = auth.uid()
        AND tm2.user_id = profiles.id
    )
  );

CREATE POLICY "profiles: insert own"
  ON public.profiles FOR INSERT
  WITH CHECK (id = auth.uid());

CREATE POLICY "profiles: update own"
  ON public.profiles FOR UPDATE
  USING (id = auth.uid());

-- ── trips ────────────────────────────────────────────────────────
ALTER TABLE public.trips ENABLE ROW LEVEL SECURITY;

CREATE POLICY "trips: members can select"
  ON public.trips FOR SELECT
  USING (public.is_trip_member(id));

-- Any authenticated user may create a trip (they become owner via trigger)
CREATE POLICY "trips: authenticated can insert"
  ON public.trips FOR INSERT
  WITH CHECK (owner_id = auth.uid());

CREATE POLICY "trips: members can update"
  ON public.trips FOR UPDATE
  USING (public.is_trip_member(id));

-- Only the owner can delete the whole trip
CREATE POLICY "trips: owner can delete"
  ON public.trips FOR DELETE
  USING (owner_id = auth.uid());

-- ── trip_members ────────────────────────────────────────────────
ALTER TABLE public.trip_members ENABLE ROW LEVEL SECURITY;

-- Any member of a trip can see who else is in it
CREATE POLICY "trip_members: members can select"
  ON public.trip_members FOR SELECT
  USING (public.is_trip_member(trip_id));

-- Only the trip owner can add new members.
-- Note: the owner's own row is inserted by the SECURITY DEFINER trigger,
-- which bypasses RLS, so this policy only covers manual invites.
CREATE POLICY "trip_members: owner can insert"
  ON public.trip_members FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.trip_members
      WHERE trip_id  = trip_members.trip_id
        AND user_id  = auth.uid()
        AND role     = 'owner'
    )
  );

-- Owner can remove any member; editors can remove themselves (leave trip)
CREATE POLICY "trip_members: owner can delete or member can leave"
  ON public.trip_members FOR DELETE
  USING (
    user_id = auth.uid()   -- leave trip yourself
    OR EXISTS (
      SELECT 1 FROM public.trip_members tm
      WHERE tm.trip_id = trip_members.trip_id
        AND tm.user_id = auth.uid()
        AND tm.role    = 'owner'
    )
  );

-- ── itinerary_items ─────────────────────────────────────────────
ALTER TABLE public.itinerary_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "itinerary: members can select"
  ON public.itinerary_items FOR SELECT
  USING (public.is_trip_member(trip_id));

CREATE POLICY "itinerary: members can insert"
  ON public.itinerary_items FOR INSERT
  WITH CHECK (public.is_trip_member(trip_id) AND created_by = auth.uid());

CREATE POLICY "itinerary: members can update"
  ON public.itinerary_items FOR UPDATE
  USING (public.is_trip_member(trip_id));

CREATE POLICY "itinerary: members can delete"
  ON public.itinerary_items FOR DELETE
  USING (public.is_trip_member(trip_id));

-- ── ideas ────────────────────────────────────────────────────────
ALTER TABLE public.ideas ENABLE ROW LEVEL SECURITY;

CREATE POLICY "ideas: members can select"
  ON public.ideas FOR SELECT
  USING (public.is_trip_member(trip_id));

CREATE POLICY "ideas: members can insert"
  ON public.ideas FOR INSERT
  WITH CHECK (public.is_trip_member(trip_id) AND created_by = auth.uid());

CREATE POLICY "ideas: members can update"
  ON public.ideas FOR UPDATE
  USING (public.is_trip_member(trip_id));

CREATE POLICY "ideas: members can delete"
  ON public.ideas FOR DELETE
  USING (public.is_trip_member(trip_id));

-- ── diary_entries ────────────────────────────────────────────────
ALTER TABLE public.diary_entries ENABLE ROW LEVEL SECURITY;

CREATE POLICY "diary: members can select"
  ON public.diary_entries FOR SELECT
  USING (public.is_trip_member(trip_id));

CREATE POLICY "diary: members can insert"
  ON public.diary_entries FOR INSERT
  WITH CHECK (public.is_trip_member(trip_id) AND created_by = auth.uid());

CREATE POLICY "diary: members can update"
  ON public.diary_entries FOR UPDATE
  USING (public.is_trip_member(trip_id));

CREATE POLICY "diary: members can delete"
  ON public.diary_entries FOR DELETE
  USING (public.is_trip_member(trip_id));


-- ================================================================
-- STORAGE BUCKETS
-- Buckets are public (URLs are shareable); upload/delete is gated
-- to trip members via storage policies.
-- File path convention inside every bucket: {trip_id}/{filename}
-- ================================================================

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES
  ('trip-covers',
   'trip-covers',
   true,
   5242880,                                            -- 5 MB
   ARRAY['image/jpeg','image/png','image/webp']),

  ('idea-images',
   'idea-images',
   true,
   5242880,                                            -- 5 MB
   ARRAY['image/jpeg','image/png','image/webp']),

  ('diary-photos',
   'diary-photos',
   true,
   10485760,                                           -- 10 MB
   ARRAY['image/jpeg','image/png','image/webp','image/heic'])
ON CONFLICT (id) DO NOTHING;

-- ── trip-covers storage policies ────────────────────────────────
CREATE POLICY "trip-covers: members can upload"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'trip-covers'
    AND auth.role() = 'authenticated'
    AND public.is_trip_member((storage.foldername(name))[1]::UUID)
  );

CREATE POLICY "trip-covers: members can update"
  ON storage.objects FOR UPDATE
  USING (
    bucket_id = 'trip-covers'
    AND public.is_trip_member((storage.foldername(name))[1]::UUID)
  );

CREATE POLICY "trip-covers: members can delete"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'trip-covers'
    AND public.is_trip_member((storage.foldername(name))[1]::UUID)
  );

-- ── idea-images storage policies ────────────────────────────────
CREATE POLICY "idea-images: members can upload"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'idea-images'
    AND auth.role() = 'authenticated'
    AND public.is_trip_member((storage.foldername(name))[1]::UUID)
  );

CREATE POLICY "idea-images: members can update"
  ON storage.objects FOR UPDATE
  USING (
    bucket_id = 'idea-images'
    AND public.is_trip_member((storage.foldername(name))[1]::UUID)
  );

CREATE POLICY "idea-images: members can delete"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'idea-images'
    AND public.is_trip_member((storage.foldername(name))[1]::UUID)
  );

-- ── diary-photos storage policies ───────────────────────────────
CREATE POLICY "diary-photos: members can upload"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'diary-photos'
    AND auth.role() = 'authenticated'
    AND public.is_trip_member((storage.foldername(name))[1]::UUID)
  );

CREATE POLICY "diary-photos: members can update"
  ON storage.objects FOR UPDATE
  USING (
    bucket_id = 'diary-photos'
    AND public.is_trip_member((storage.foldername(name))[1]::UUID)
  );

CREATE POLICY "diary-photos: members can delete"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'diary-photos'
    AND public.is_trip_member((storage.foldername(name))[1]::UUID)
  );


-- ================================================================
-- REAL-TIME
-- Adds all collaborative tables to the supabase_realtime
-- publication so Postgres logical replication streams changes
-- to connected clients instantly.
-- ================================================================
-- ── attachments storage ─────────────────────────────────────────
INSERT INTO storage.buckets (id, name, public) VALUES ('attachments', 'attachments', true)
  ON CONFLICT (id) DO NOTHING;

CREATE POLICY "attachments: members can upload"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'attachments'
    AND auth.role() = 'authenticated'
    AND public.is_trip_member((storage.foldername(name))[1]::UUID)
  );

CREATE POLICY "attachments: public read"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'attachments');

CREATE POLICY "attachments: members can delete"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'attachments'
    AND public.is_trip_member((storage.foldername(name))[1]::UUID)
  );


ALTER PUBLICATION supabase_realtime ADD TABLE
  public.trips,
  public.trip_members,
  public.itinerary_items,
  public.ideas,
  public.diary_entries;
