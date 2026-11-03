CREATE TYPE public.sermon_status AS ENUM ('draft','ready');

CREATE TABLE public.sermons (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id uuid NOT NULL DEFAULT auth.uid(),
  title text NOT NULL DEFAULT '',
  body text NOT NULL DEFAULT '',
  bible_reference text NOT NULL DEFAULT '',
  theme text NOT NULL DEFAULT '',
  status public.sermon_status NOT NULL DEFAULT 'draft',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.sermons TO authenticated;
GRANT ALL ON public.sermons TO service_role;
ALTER TABLE public.sermons ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own sermons select" ON public.sermons FOR SELECT TO authenticated USING (auth.uid() = owner_id);
CREATE POLICY "own sermons insert" ON public.sermons FOR INSERT TO authenticated WITH CHECK (auth.uid() = owner_id);
CREATE POLICY "own sermons update" ON public.sermons FOR UPDATE TO authenticated USING (auth.uid() = owner_id) WITH CHECK (auth.uid() = owner_id);
CREATE POLICY "own sermons delete" ON public.sermons FOR DELETE TO authenticated USING (auth.uid() = owner_id);
CREATE INDEX sermons_owner_idx ON public.sermons(owner_id, updated_at DESC);

CREATE OR REPLACE FUNCTION public.touch_updated_at() RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END; $$;
CREATE TRIGGER sermons_touch BEFORE UPDATE ON public.sermons FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

CREATE TABLE public.collections (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id uuid NOT NULL DEFAULT auth.uid(),
  name text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.collections TO authenticated;
GRANT ALL ON public.collections TO service_role;
ALTER TABLE public.collections ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own collections select" ON public.collections FOR SELECT TO authenticated USING (auth.uid() = owner_id);
CREATE POLICY "own collections insert" ON public.collections FOR INSERT TO authenticated WITH CHECK (auth.uid() = owner_id);
CREATE POLICY "own collections update" ON public.collections FOR UPDATE TO authenticated USING (auth.uid() = owner_id) WITH CHECK (auth.uid() = owner_id);
CREATE POLICY "own collections delete" ON public.collections FOR DELETE TO authenticated USING (auth.uid() = owner_id);

CREATE TABLE public.holyrics_configs (
  owner_id uuid PRIMARY KEY DEFAULT auth.uid(),
  api_key text NOT NULL,
  server_token text NOT NULL,
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.holyrics_configs TO authenticated;
GRANT ALL ON public.holyrics_configs TO service_role;
ALTER TABLE public.holyrics_configs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own holyrics select" ON public.holyrics_configs FOR SELECT TO authenticated USING (auth.uid() = owner_id);
CREATE POLICY "own holyrics insert" ON public.holyrics_configs FOR INSERT TO authenticated WITH CHECK (auth.uid() = owner_id);
CREATE POLICY "own holyrics update" ON public.holyrics_configs FOR UPDATE TO authenticated USING (auth.uid() = owner_id) WITH CHECK (auth.uid() = owner_id);
CREATE POLICY "own holyrics delete" ON public.holyrics_configs FOR DELETE TO authenticated USING (auth.uid() = owner_id);