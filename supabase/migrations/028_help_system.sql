-- supabase/migrations/028_help_system.sql
-- Help system: contextual tooltips + help articles
-- Two admin-editable tables. RLS: authenticated reads published rows (admin reads all).
-- All writes are admin-only.

CREATE TABLE IF NOT EXISTS public.help_tooltips (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  area_key text NOT NULL UNIQUE,
  title text NOT NULL,
  body text NOT NULL,
  linked_article_slug text,
  is_published boolean NOT NULL DEFAULT true,
  is_seed_data boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.help_articles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text NOT NULL UNIQUE,
  category text NOT NULL,
  title text NOT NULL,
  body text NOT NULL,
  area_key text,
  audience text NOT NULL DEFAULT 'client',
  sort_order int NOT NULL DEFAULT 0,
  is_published boolean NOT NULL DEFAULT true,
  is_seed_data boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Performance index for the help-center list query
CREATE INDEX IF NOT EXISTS help_articles_audience_idx
  ON public.help_articles (audience, category, is_published, sort_order);

-- updated_at triggers (uses existing handle_updated_at() function)
CREATE TRIGGER set_help_tooltips_updated_at
  BEFORE UPDATE ON public.help_tooltips
  FOR EACH ROW EXECUTE FUNCTION handle_updated_at();

CREATE TRIGGER set_help_articles_updated_at
  BEFORE UPDATE ON public.help_articles
  FOR EACH ROW EXECUTE FUNCTION handle_updated_at();

-- RLS
ALTER TABLE public.help_tooltips ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.help_articles ENABLE ROW LEVEL SECURITY;

-- SELECT: authenticated users see published rows; admins see all (including drafts)
CREATE POLICY "help_tooltips_select" ON public.help_tooltips
  FOR SELECT TO authenticated
  USING (is_published = true OR get_my_role() = 'admin');

CREATE POLICY "help_articles_select" ON public.help_articles
  FOR SELECT TO authenticated
  USING (is_published = true OR get_my_role() = 'admin');

-- INSERT / UPDATE / DELETE: admin only
CREATE POLICY "help_tooltips_admin_write" ON public.help_tooltips
  FOR ALL TO authenticated
  USING (get_my_role() = 'admin')
  WITH CHECK (get_my_role() = 'admin');

CREATE POLICY "help_articles_admin_write" ON public.help_articles
  FOR ALL TO authenticated
  USING (get_my_role() = 'admin')
  WITH CHECK (get_my_role() = 'admin');
