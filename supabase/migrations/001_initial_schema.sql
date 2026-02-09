-- ============================================================
-- ClipForge — Schéma complet de la base de données
-- À exécuter dans Supabase SQL Editor
-- ============================================================

-- ============================================================
-- 0. NETTOYAGE (drop table existante videos v1)
-- ============================================================
DROP POLICY IF EXISTS "Users can insert their own videos" ON public.videos;
DROP POLICY IF EXISTS "Users can view their own videos" ON public.videos;
DROP POLICY IF EXISTS "Users can update their own videos" ON public.videos;
DROP TABLE IF EXISTS public.videos CASCADE;

-- ============================================================
-- 1. ENUMS
-- ============================================================
CREATE TYPE public.plan_type AS ENUM ('free', 'pro', 'business');
CREATE TYPE public.video_status AS ENUM ('uploaded', 'processing', 'ready', 'failed');
CREATE TYPE public.clip_status AS ENUM ('pending', 'generating', 'ready', 'failed');
CREATE TYPE public.job_type AS ENUM ('transcription', 'clip_generation', 'subtitle_burn');
CREATE TYPE public.job_status AS ENUM ('pending', 'processing', 'completed', 'failed');

-- ============================================================
-- 2. FONCTION updated_at automatique
-- ============================================================
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================
-- 3. TABLE profiles
-- ============================================================
CREATE TABLE public.profiles (
  id            uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email         text NOT NULL,
  full_name     text,
  avatar_url    text,
  plan          public.plan_type NOT NULL DEFAULT 'free',
  credits_remaining integer NOT NULL DEFAULT 10,
  stripe_customer_id     text,
  stripe_subscription_id text,
  created_at    timestamptz NOT NULL DEFAULT now(),
  updated_at    timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_profiles_plan ON public.profiles(plan);
CREATE INDEX idx_profiles_stripe_customer ON public.profiles(stripe_customer_id) WHERE stripe_customer_id IS NOT NULL;

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own profile"
  ON public.profiles FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile"
  ON public.profiles FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

CREATE TRIGGER profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- ============================================================
-- 4. TRIGGER auto-création profile lors du signup
-- ============================================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, avatar_url)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data ->> 'full_name', ''),
    COALESCE(NEW.raw_user_meta_data ->> 'avatar_url', '')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ============================================================
-- 5. TABLE videos
-- ============================================================
CREATE TABLE public.videos (
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id           uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  title             text NOT NULL,
  original_filename text NOT NULL,
  storage_path      text NOT NULL,
  duration_seconds  real,
  file_size_bytes   bigint NOT NULL,
  status            public.video_status NOT NULL DEFAULT 'uploaded',
  metadata          jsonb DEFAULT '{}'::jsonb,
  created_at        timestamptz NOT NULL DEFAULT now(),
  updated_at        timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_videos_user_id ON public.videos(user_id);
CREATE INDEX idx_videos_status ON public.videos(status);
CREATE INDEX idx_videos_user_status ON public.videos(user_id, status);
CREATE INDEX idx_videos_created_at ON public.videos(created_at DESC);

ALTER TABLE public.videos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can insert their own videos"
  ON public.videos FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view their own videos"
  ON public.videos FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own videos"
  ON public.videos FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own videos"
  ON public.videos FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

CREATE TRIGGER videos_updated_at
  BEFORE UPDATE ON public.videos
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- ============================================================
-- 6. TABLE transcriptions
-- ============================================================
CREATE TABLE public.transcriptions (
  id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  video_id         uuid NOT NULL REFERENCES public.videos(id) ON DELETE CASCADE,
  full_text        text NOT NULL DEFAULT '',
  segments         jsonb NOT NULL DEFAULT '[]'::jsonb,
  language         text NOT NULL DEFAULT 'fr',
  confidence_score real,
  created_at       timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_transcriptions_video_id ON public.transcriptions(video_id);

ALTER TABLE public.transcriptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view transcriptions of their videos"
  ON public.transcriptions FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.videos
      WHERE videos.id = transcriptions.video_id
        AND videos.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert transcriptions for their videos"
  ON public.transcriptions FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.videos
      WHERE videos.id = transcriptions.video_id
        AND videos.user_id = auth.uid()
    )
  );

-- ============================================================
-- 7. TABLE clips
-- ============================================================
CREATE TABLE public.clips (
  id                 uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  video_id           uuid NOT NULL REFERENCES public.videos(id) ON DELETE CASCADE,
  user_id            uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  title              text NOT NULL,
  description        text,
  hashtags           text[] DEFAULT '{}',
  start_time_seconds real NOT NULL,
  end_time_seconds   real NOT NULL,
  storage_path       text,
  thumbnail_path     text,
  subtitle_style     text DEFAULT 'default',
  status             public.clip_status NOT NULL DEFAULT 'pending',
  virality_score     real,
  created_at         timestamptz NOT NULL DEFAULT now(),
  updated_at         timestamptz NOT NULL DEFAULT now(),

  CONSTRAINT clips_time_range CHECK (end_time_seconds > start_time_seconds)
);

CREATE INDEX idx_clips_video_id ON public.clips(video_id);
CREATE INDEX idx_clips_user_id ON public.clips(user_id);
CREATE INDEX idx_clips_status ON public.clips(status);
CREATE INDEX idx_clips_user_status ON public.clips(user_id, status);
CREATE INDEX idx_clips_virality ON public.clips(virality_score DESC NULLS LAST);

ALTER TABLE public.clips ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can insert their own clips"
  ON public.clips FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view their own clips"
  ON public.clips FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own clips"
  ON public.clips FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own clips"
  ON public.clips FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

CREATE TRIGGER clips_updated_at
  BEFORE UPDATE ON public.clips
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- ============================================================
-- 8. TABLE processing_jobs
-- ============================================================
CREATE TABLE public.processing_jobs (
  id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id          uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  video_id         uuid REFERENCES public.videos(id) ON DELETE SET NULL,
  clip_id          uuid REFERENCES public.clips(id) ON DELETE SET NULL,
  job_type         public.job_type NOT NULL,
  status           public.job_status NOT NULL DEFAULT 'pending',
  progress_percent integer NOT NULL DEFAULT 0 CHECK (progress_percent BETWEEN 0 AND 100),
  error_message    text,
  started_at       timestamptz,
  completed_at     timestamptz,
  created_at       timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_jobs_user_id ON public.processing_jobs(user_id);
CREATE INDEX idx_jobs_status ON public.processing_jobs(status);
CREATE INDEX idx_jobs_user_status ON public.processing_jobs(user_id, status);
CREATE INDEX idx_jobs_video_id ON public.processing_jobs(video_id) WHERE video_id IS NOT NULL;
CREATE INDEX idx_jobs_clip_id ON public.processing_jobs(clip_id) WHERE clip_id IS NOT NULL;

ALTER TABLE public.processing_jobs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own jobs"
  ON public.processing_jobs FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own jobs"
  ON public.processing_jobs FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own jobs"
  ON public.processing_jobs FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- ============================================================
-- 9. STORAGE BUCKET (idempotent)
-- ============================================================
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('videos', 'videos', false, 524288000, ARRAY['video/mp4', 'video/quicktime', 'video/x-msvideo', 'image/jpeg', 'image/png'])
ON CONFLICT (id) DO UPDATE SET
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

-- Storage policies (drop + recreate for idempotency)
DROP POLICY IF EXISTS "Authenticated users can upload videos" ON storage.objects;
DROP POLICY IF EXISTS "Users can view their own videos" ON storage.objects;

CREATE POLICY "Authenticated users can upload videos"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'videos'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

CREATE POLICY "Users can view their own videos"
  ON storage.objects FOR SELECT
  TO authenticated
  USING (
    bucket_id = 'videos'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

CREATE POLICY "Users can delete their own videos"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'videos'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );
