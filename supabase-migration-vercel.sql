-- Migração para Integração Vercel e Novos Campos de Tracking

-- Tabela: funnels
ALTER TABLE funnels ADD COLUMN IF NOT EXISTS quiz_url text;
ALTER TABLE funnels ADD COLUMN IF NOT EXISTS last_page_url text;
ALTER TABLE funnels ADD COLUMN IF NOT EXISTS last_domain text;
ALTER TABLE funnels ADD COLUMN IF NOT EXISTS last_event_name text;
ALTER TABLE funnels ADD COLUMN IF NOT EXISTS published boolean DEFAULT false;
ALTER TABLE funnels ADD COLUMN IF NOT EXISTS published_at timestamptz;

-- Tabela: tracking_events
ALTER TABLE tracking_events ADD COLUMN IF NOT EXISTS public_key text;
ALTER TABLE tracking_events ADD COLUMN IF NOT EXISTS event_value text;

-- Tabela: leads
ALTER TABLE leads ADD COLUMN IF NOT EXISTS whatsapp text;
