-- Script para criar as tabelas no Supabase

-- Tabela de Funis
CREATE TABLE IF NOT EXISTS funnels (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  funnel_id text UNIQUE NOT NULL,
  name text NOT NULL,
  public_key text NOT NULL,
  status text DEFAULT 'active',
  domain_allowed text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  last_event_at timestamptz
);

-- Tabela de Tracking Events
CREATE TABLE IF NOT EXISTS tracking_events (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  funnel_id text REFERENCES funnels(funnel_id),
  lead_id text NOT NULL,
  event_name text NOT NULL,
  step_number numeric,
  question text,
  answer text,
  event_data jsonb,
  utm_source text,
  utm_medium text,
  utm_campaign text,
  utm_content text,
  utm_term text,
  fbclid text,
  gclid text,
  country text,
  page_url text,
  referrer text,
  user_agent text,
  device_type text,
  browser_language text,
  created_at timestamptz DEFAULT now()
);

-- Tabela de Leads
CREATE TABLE IF NOT EXISTS leads (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  funnel_id text REFERENCES funnels(funnel_id),
  lead_id text UNIQUE NOT NULL,
  name text,
  phone text,
  email text,
  status text DEFAULT 'Iniciado',
  result text,
  current_step numeric DEFAULT 0,
  total_steps numeric DEFAULT 0,
  utm_source text,
  utm_medium text,
  utm_campaign text,
  utm_content text,
  utm_term text,
  fbclid text,
  gclid text,
  country text,
  page_url text,
  user_agent text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  completed_at timestamptz
);

-- Tabela de Respostas
CREATE TABLE IF NOT EXISTS lead_answers (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  funnel_id text REFERENCES funnels(funnel_id),
  lead_id text NOT NULL,
  step_number numeric NOT NULL,
  question text,
  answer text,
  created_at timestamptz DEFAULT now()
);

-- Perfil, sessoes e preferências do painel SaaS
CREATE TABLE IF NOT EXISTS profiles (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid UNIQUE,
  display_name text NOT NULL DEFAULT 'Tiago Silva',
  role text NOT NULL DEFAULT 'Admin do Ecossistema',
  avatar_url text,
  avatar_data text,
  email text,
  notification_preferences jsonb DEFAULT '{"sales":true,"pixel":true,"ai":true,"channels":{"push":true,"email":true,"central":true}}',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS user_sessions (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid,
  session_id text UNIQUE NOT NULL,
  device_name text,
  device_type text,
  location text,
  user_agent text,
  last_access timestamptz DEFAULT now(),
  revoked_at timestamptz
);

CREATE TABLE IF NOT EXISTS ai_evolution_requests (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid,
  command text NOT NULL,
  action_type text,
  title text,
  description text,
  status text DEFAULT 'pendente',
  applied_at timestamptz,
  created_at timestamptz DEFAULT now()
);

-- Regras de RLS Básicas (Simples para Integração JS Pura)
ALTER TABLE funnels ENABLE ROW LEVEL SECURITY;
ALTER TABLE tracking_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE lead_answers ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_evolution_requests ENABLE ROW LEVEL SECURITY;

-- Políticas Públicas de Insert (Somente Insert, Sem Select para Segurança)
CREATE POLICY "Public insert events" ON tracking_events FOR INSERT TO public WITH CHECK (true);
CREATE POLICY "Public insert leads" ON leads FOR INSERT TO public WITH CHECK (true);
CREATE POLICY "Public update leads" ON leads FOR UPDATE TO public USING (true) WITH CHECK (true);
CREATE POLICY "Public insert answers" ON lead_answers FOR INSERT TO public WITH CHECK (true);
CREATE POLICY "Public select funnels by key limit" ON funnels FOR SELECT TO public USING (true); -- Permitir leitura para validação leve

-- Políticas para usuários logados/admin verificarem os resultados no Dashboard
CREATE POLICY "Admin select events" ON tracking_events FOR SELECT USING (true);
CREATE POLICY "Admin select leads" ON leads FOR SELECT USING (true);
CREATE POLICY "Admin select answers" ON lead_answers FOR SELECT USING (true);
CREATE POLICY "Admin manage funnels" ON funnels FOR ALL USING (true);
CREATE POLICY "Admin manage profiles" ON profiles FOR ALL USING (true);
CREATE POLICY "Admin manage sessions" ON user_sessions FOR ALL USING (true);
CREATE POLICY "Admin manage ai evolution" ON ai_evolution_requests FOR ALL USING (true);
