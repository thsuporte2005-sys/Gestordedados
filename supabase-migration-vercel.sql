-- Migracao para Pixel Universal multi-quiz

-- Compatibilidade com o painel anterior.
-- Algumas bases antigas ainda nao possuem funnels/tracking_events.
DO $$
BEGIN
  IF to_regclass('public.funnels') IS NOT NULL THEN
    ALTER TABLE funnels ADD COLUMN IF NOT EXISTS quiz_url text;
    ALTER TABLE funnels ADD COLUMN IF NOT EXISTS last_page_url text;
    ALTER TABLE funnels ADD COLUMN IF NOT EXISTS last_domain text;
    ALTER TABLE funnels ADD COLUMN IF NOT EXISTS last_event_name text;
    ALTER TABLE funnels ADD COLUMN IF NOT EXISTS last_heartbeat_at timestamptz;
    ALTER TABLE funnels ADD COLUMN IF NOT EXISTS published boolean DEFAULT false;
    ALTER TABLE funnels ADD COLUMN IF NOT EXISTS published_at timestamptz;
    CREATE INDEX IF NOT EXISTS idx_funnels_last_heartbeat_at ON funnels(last_heartbeat_at DESC);
  END IF;

  IF to_regclass('public.tracking_events') IS NOT NULL THEN
    ALTER TABLE tracking_events ADD COLUMN IF NOT EXISTS public_key text;
    ALTER TABLE tracking_events ADD COLUMN IF NOT EXISTS session_id text;
    ALTER TABLE tracking_events ADD COLUMN IF NOT EXISTS event_value text;

    IF EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_schema = 'public' AND table_name = 'tracking_events'
        AND column_name IN ('funnel_id', 'created_at')
      GROUP BY table_name
      HAVING count(DISTINCT column_name) = 2
    ) THEN
      CREATE INDEX IF NOT EXISTS idx_tracking_events_funnel_created_at ON tracking_events(funnel_id, created_at DESC);
    END IF;

    IF EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_schema = 'public' AND table_name = 'tracking_events'
        AND column_name IN ('funnel_id', 'event_name', 'created_at')
      GROUP BY table_name
      HAVING count(DISTINCT column_name) = 3
    ) THEN
      CREATE INDEX IF NOT EXISTS idx_tracking_events_funnel_event_created_at ON tracking_events(funnel_id, event_name, created_at DESC);
    END IF;
  END IF;

  IF to_regclass('public.leads') IS NOT NULL AND EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'leads'
      AND column_name IN ('funnel_id', 'created_at')
    GROUP BY table_name
    HAVING count(DISTINCT column_name) = 2
  ) THEN
    CREATE INDEX IF NOT EXISTS idx_leads_funnel_created_at ON leads(funnel_id, created_at DESC);
  END IF;
END $$;

-- Novo gerenciador de pixels individuais por quiz
CREATE TABLE IF NOT EXISTS quiz_pixels (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid,
  quiz_id text NOT NULL UNIQUE,
  quiz_name text,
  pixel_id text NOT NULL UNIQUE,
  public_key text NOT NULL,
  domain text,
  integrated_url text,
  status text DEFAULT 'aguardando_instalacao',
  last_event_name text,
  last_event_at timestamptz,
  last_heartbeat_at timestamptz,
  events_today int DEFAULT 0,
  leads_today int DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS pixel_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  pixel_id text NOT NULL REFERENCES quiz_pixels(pixel_id) ON DELETE CASCADE,
  quiz_id text NOT NULL,
  event_name text NOT NULL,
  event_type text,
  page_url text,
  domain text,
  session_id text,
  visitor_id text,
  payload jsonb,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS pixel_diagnostics (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  pixel_id text NOT NULL REFERENCES quiz_pixels(pixel_id) ON DELETE CASCADE,
  quiz_id text NOT NULL,
  script_ok boolean DEFAULT false,
  endpoint_ok boolean DEFAULT false,
  database_ok boolean DEFAULT false,
  domain_ok boolean DEFAULT false,
  last_error text,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_quiz_pixels_pixel_id ON quiz_pixels(pixel_id);
CREATE INDEX IF NOT EXISTS idx_quiz_pixels_quiz_id ON quiz_pixels(quiz_id);
CREATE INDEX IF NOT EXISTS idx_quiz_pixels_status ON quiz_pixels(status);
CREATE INDEX IF NOT EXISTS idx_pixel_events_pixel_created_at ON pixel_events(pixel_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_pixel_events_pixel_event_created_at ON pixel_events(pixel_id, event_name, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_pixel_diagnostics_pixel_created_at ON pixel_diagnostics(pixel_id, created_at DESC);

ALTER TABLE quiz_pixels ENABLE ROW LEVEL SECURITY;
ALTER TABLE pixel_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE pixel_diagnostics ENABLE ROW LEVEL SECURITY;
