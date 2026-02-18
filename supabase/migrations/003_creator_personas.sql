-- Colonne suggestion_data sur clips (stocke la suggestion IA originale)
ALTER TABLE public.clips ADD COLUMN suggestion_data jsonb;

-- Table creator_personas (1 row par user)
CREATE TABLE public.creator_personas (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     uuid NOT NULL UNIQUE REFERENCES public.profiles(id) ON DELETE CASCADE,
  persona_summary text NOT NULL DEFAULT '',
  clip_count  integer NOT NULL DEFAULT 0,
  created_at  timestamptz NOT NULL DEFAULT now(),
  updated_at  timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.creator_personas ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own persona"
  ON public.creator_personas FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own persona"
  ON public.creator_personas FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own persona"
  ON public.creator_personas FOR UPDATE TO authenticated
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE TRIGGER creator_personas_updated_at
  BEFORE UPDATE ON public.creator_personas
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
