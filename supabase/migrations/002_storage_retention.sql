-- ============================================================
-- ClipForge — Rétention du stockage
-- Vidéos supprimées après 7 jours, clips après 15 jours
-- Les clips survivent à la suppression de leur vidéo source
-- ============================================================

-- 1. Rendre video_id nullable sur clips
ALTER TABLE public.clips
  ALTER COLUMN video_id DROP NOT NULL;

-- 2. Changer la FK de CASCADE à SET NULL
ALTER TABLE public.clips
  DROP CONSTRAINT clips_video_id_fkey,
  ADD CONSTRAINT clips_video_id_fkey
    FOREIGN KEY (video_id) REFERENCES public.videos(id) ON DELETE SET NULL;
