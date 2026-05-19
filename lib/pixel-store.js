const { createClient } = require('@supabase/supabase-js');

const ACTIVE_CONNECTED_MS = 60000;
const ACTIVE_UNSTABLE_MS = 180000;
const STORE_HEARTBEATS = process.env.PIXEL_STORE_HEARTBEATS === '1';
const ALLOWED_ORIGINS = (process.env.PIXEL_ALLOWED_ORIGINS || '*').split(',').map((origin) => origin.trim()).filter(Boolean);

let supabaseClient = null;

function setCors(req, res) {
  const origin = req.headers.origin || '*';
  const allowAll = ALLOWED_ORIGINS.includes('*');
  const allowedOrigin = allowAll || ALLOWED_ORIGINS.includes(origin) ? origin : ALLOWED_ORIGINS[0] || '*';
  res.setHeader('Access-Control-Allow-Origin', allowAll ? '*' : allowedOrigin);
  res.setHeader('Vary', 'Origin');
  res.setHeader('Access-Control-Allow-Headers', 'Authorization, Content-Type, X-Gestor-Pixel');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PATCH, DELETE, OPTIONS, HEAD');
  res.setHeader('Access-Control-Max-Age', '86400');
}

function json(res, status, body) {
  return res.status(status).json({ success: status >= 200 && status < 300, ...body });
}

function getSupabase() {
  if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) return null;
  if (!supabaseClient) {
    supabaseClient = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, {
      auth: { persistSession: false },
      global: { headers: { 'x-application-name': 'gestor-pixel-manager' } }
    });
  }
  return supabaseClient;
}

function text(value, max = 500) {
  if (value === null || value === undefined) return null;
  return String(value).trim().slice(0, max);
}

function parseBody(req) {
  if (!req.body) return {};
  if (typeof req.body === 'string') {
    try {
      return JSON.parse(req.body);
    } catch (error) {
      return {};
    }
  }
  return req.body;
}

function randomId(prefix, size = 14) {
  return `${prefix}_${Math.random().toString(36).slice(2, 2 + size)}${Date.now().toString(36).slice(-4)}`;
}

function normalizeDomain(value) {
  const raw = text(value, 300);
  if (!raw) return null;
  try {
    return new URL(raw.includes('://') ? raw : `https://${raw}`).hostname.replace(/^www\./, '').toLowerCase();
  } catch (error) {
    return raw.replace(/^www\./, '').toLowerCase();
  }
}

function domainFromUrl(pageUrl) {
  try {
    return pageUrl ? new URL(pageUrl).hostname.replace(/^www\./, '').toLowerCase() : null;
  } catch (error) {
    return null;
  }
}

function domainAllowed(allowedDomain, actualDomain) {
  const allowed = normalizeDomain(allowedDomain);
  const actual = normalizeDomain(actualDomain);
  if (!allowed || !actual) return true;
  return actual === allowed || actual.endsWith(`.${allowed}`);
}

function deriveStatus(pixel) {
  if (!pixel) return 'none';
  if (pixel.status === 'erro_dominio') return 'erro_dominio';
  if (!pixel.last_event_at && !pixel.last_heartbeat_at) return 'aguardando_instalacao';
  if (!pixel.last_heartbeat_at) return 'offline';
  const age = Date.now() - new Date(pixel.last_heartbeat_at).getTime();
  if (!Number.isFinite(age)) return 'offline';
  if (age <= ACTIVE_CONNECTED_MS) return 'conectado';
  if (age <= ACTIVE_UNSTABLE_MS) return 'instavel';
  return 'offline';
}

function statusLabel(status) {
  return {
    none: 'Nenhum quiz selecionado',
    conectado: 'Pixel conectado',
    instavel: 'Instavel',
    offline: 'Pixel offline',
    aguardando_instalacao: 'Aguardando instalacao',
    erro_dominio: 'Erro de dominio'
  }[status] || 'Aguardando instalacao';
}

function publicPixel(pixel) {
  const status = deriveStatus(pixel);
  return {
    ...pixel,
    status,
    status_label: statusLabel(status)
  };
}

async function findPixel(supabase, { pixel_id, quiz_id, public_key }) {
  let query = supabase.from('quiz_pixels').select('*');
  if (pixel_id) query = query.eq('pixel_id', pixel_id);
  else if (quiz_id) query = query.eq('quiz_id', quiz_id);
  else return null;

  const { data, error } = await query.maybeSingle();
  if (error) throw error;
  if (!data) return null;
  if (public_key && data.public_key !== public_key) {
    const invalid = new Error('Invalid public_key for this pixel');
    invalid.code = 'INVALID_PUBLIC_KEY';
    throw invalid;
  }
  return data;
}

function normalizeEvent(req) {
  const body = parseBody(req);
  const authKey = (req.headers.authorization || '').replace(/^Bearer\s+/i, '');
  const pageUrl = text(body.page_url || body.url, 1200);
  const pixelId = text(body.pixel_id || body.funnel_id || body.quiz_id, 160);
  return {
    raw: body,
    pixel_id: pixelId,
    quiz_id: text(body.quiz_id || body.funnel_id || pixelId, 160),
    public_key: text(body.public_key || authKey, 180),
    event_name: text(body.event_name || 'unknown_event', 100),
    event_type: text(body.event_type || body.event_name || 'track', 80),
    page_url: pageUrl,
    domain: text(body.domain || domainFromUrl(pageUrl), 300),
    session_id: text(body.session_id, 180),
    visitor_id: text(body.visitor_id || body.lead_id, 180),
    payload: body,
    received_at: new Date().toISOString()
  };
}

function validateEvent(event) {
  if (!event.pixel_id || !event.public_key) return 'Missing pixel_id or public_key';
  if (!/^px_[a-z0-9_-]{6,120}$/i.test(event.pixel_id) && !/^quiz_[a-z0-9_-]{3,120}$/i.test(event.pixel_id)) {
    return 'Invalid pixel_id format';
  }
  if (!/^pk_(live|test)_[a-z0-9_-]{8,140}$/i.test(event.public_key)) return 'Invalid public_key format';
  return null;
}

function redactSensitivePayload(payload) {
  const sensitiveKeys = new Set(['public_key', 'email', 'phone', 'telefone', 'whatsapp', 'name', 'nome']);
  const redact = (value) => {
    if (!value || typeof value !== 'object') return value;
    if (Array.isArray(value)) return value.map(redact);
    return Object.fromEntries(Object.entries(value).map(([key, item]) => {
      if (sensitiveKeys.has(String(key).toLowerCase())) return [key, '[redacted]'];
      return [key, redact(item)];
    }));
  };
  return redact(payload);
}

async function refreshCounters(supabase, pixel) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const todayIso = today.toISOString();
  const [{ count: eventsToday }, { count: leadsToday }] = await Promise.all([
    supabase.from('pixel_events').select('id', { count: 'exact', head: true }).eq('pixel_id', pixel.pixel_id).neq('event_name', 'pixel_heartbeat').gte('created_at', todayIso),
    supabase.from('pixel_events').select('id', { count: 'exact', head: true }).eq('pixel_id', pixel.pixel_id).eq('event_name', 'lead_created').gte('created_at', todayIso)
  ]);
  await supabase.from('quiz_pixels').update({
    events_today: eventsToday || 0,
    leads_today: leadsToday || 0,
    updated_at: new Date().toISOString()
  }).eq('pixel_id', pixel.pixel_id);
  return { events_today: eventsToday || 0, leads_today: leadsToday || 0 };
}

async function createDiagnostic(supabase, pixel, values) {
  await supabase.from('pixel_diagnostics').insert({
    pixel_id: pixel.pixel_id,
    quiz_id: pixel.quiz_id,
    script_ok: Boolean(values.script_ok),
    endpoint_ok: Boolean(values.endpoint_ok),
    database_ok: Boolean(values.database_ok),
    domain_ok: Boolean(values.domain_ok),
    last_error: text(values.last_error, 1000),
    created_at: new Date().toISOString()
  });
}

async function recordPixelEvent(event) {
  const supabase = getSupabase();
  if (!supabase) {
    console.warn('[PixelManager] Supabase env vars missing; event accepted but not persisted.');
    return { persisted: false, reason: 'supabase_missing' };
  }

  const pixel = await findPixel(supabase, {
    pixel_id: event.pixel_id,
    quiz_id: event.quiz_id,
    public_key: event.public_key
  });

  if (!pixel) {
    console.warn('[PixelManager] Unknown pixel event ignored', { pixel_id: event.pixel_id });
    return { persisted: false, reason: 'pixel_not_found' };
  }

  const eventDomain = normalizeDomain(event.domain || domainFromUrl(event.page_url));
  const okDomain = domainAllowed(pixel.domain, eventDomain);
  if (!okDomain) {
    await supabase.from('quiz_pixels').update({
      status: 'erro_dominio',
      updated_at: new Date().toISOString()
    }).eq('pixel_id', pixel.pixel_id);
    await createDiagnostic(supabase, pixel, {
      script_ok: true,
      endpoint_ok: true,
      database_ok: true,
      domain_ok: false,
      last_error: `Domain ${eventDomain || 'desconhecido'} not allowed for ${pixel.domain}`
    });
    return { persisted: false, reason: 'domain_not_allowed' };
  }

  const duplicateWindow = new Date(Date.now() - 2500).toISOString();
  const { data: duplicate } = await supabase
    .from('pixel_events')
    .select('id')
    .eq('pixel_id', pixel.pixel_id)
    .eq('event_name', event.event_name)
    .eq('session_id', event.session_id || '')
    .gte('created_at', duplicateWindow)
    .limit(1)
    .maybeSingle();

  if (duplicate) return { persisted: false, reason: 'duplicate' };

  const heartbeat = event.event_name === 'pixel_heartbeat';
  if (!heartbeat || STORE_HEARTBEATS) {
    const { error } = await supabase.from('pixel_events').insert({
      pixel_id: pixel.pixel_id,
      quiz_id: pixel.quiz_id,
      event_name: event.event_name,
      event_type: event.event_type,
      page_url: event.page_url || null,
      domain: eventDomain || null,
      session_id: event.session_id || null,
      visitor_id: event.visitor_id || null,
      payload: redactSensitivePayload(event.payload),
      created_at: new Date().toISOString()
    });
    if (error) throw error;
  }

  const now = new Date().toISOString();
  const update = {
    status: 'conectado',
    updated_at: now
  };
  if (event.page_url) update.integrated_url = pixel.integrated_url || event.page_url;
  if (eventDomain) update.domain = pixel.domain || eventDomain;
  if (heartbeat) update.last_heartbeat_at = now;
  else {
    update.last_event_at = now;
    update.last_event_name = event.event_name;
  }

  await supabase.from('quiz_pixels').update(update).eq('pixel_id', pixel.pixel_id);
  const counters = await refreshCounters(supabase, pixel);
  await createDiagnostic(supabase, { ...pixel, ...update }, {
    script_ok: true,
    endpoint_ok: true,
    database_ok: true,
    domain_ok: true,
    last_error: null
  });
  return { persisted: true, pixel: { ...pixel, ...update, ...counters } };
}

function withMethods(methods, handler) {
  return async function route(req, res) {
    setCors(req, res);
    if (req.method === 'OPTIONS') return json(res, 200, { message: 'CORS OK' });
    if (req.method === 'HEAD') return res.status(200).end();
    if (!methods.includes(req.method)) return json(res, 405, { message: 'Method Not Allowed' });
    try {
      return await handler(req, res);
    } catch (error) {
      console.error('[PixelManager] route failed', { message: error.message });
      return json(res, 500, { message: 'Internal server error', details: error.message });
    }
  };
}

module.exports = {
  ACTIVE_CONNECTED_MS,
  ACTIVE_UNSTABLE_MS,
  createDiagnostic,
  deriveStatus,
  domainAllowed,
  domainFromUrl,
  findPixel,
  getSupabase,
  json,
  normalizeDomain,
  normalizeEvent,
  parseBody,
  publicPixel,
  randomId,
  recordPixelEvent,
  refreshCounters,
  setCors,
  statusLabel,
  text,
  validateEvent,
  withMethods
};
