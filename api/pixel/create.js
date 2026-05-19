const {
  getSupabase,
  json,
  parseBody,
  publicPixel,
  randomId,
  text,
  withMethods
} = require('../../lib/pixel-store');

module.exports = withMethods(['POST'], async function handler(req, res) {
  const body = parseBody(req);
  const now = new Date().toISOString();
  const pixel = {
    user_id: body.user_id || null,
    quiz_id: text(body.quiz_id, 120) || randomId('quiz', 10),
    quiz_name: text(body.quiz_name, 180) || 'Novo Quiz',
    pixel_id: randomId('px', 14),
    public_key: `pk_live_${Math.random().toString(36).slice(2, 18)}${Date.now().toString(36).slice(-4)}`,
    domain: text(body.domain, 300),
    integrated_url: text(body.integrated_url, 1200),
    status: 'aguardando_instalacao',
    events_today: 0,
    leads_today: 0,
    created_at: now,
    updated_at: now
  };

  const supabase = getSupabase();
  if (!supabase) {
    return json(res, 200, {
      pixel: publicPixel(pixel),
      persisted: false,
      diagnostics: { database: { ok: false, label: 'Supabase nao configurado' } }
    });
  }

  const { data, error } = await supabase
    .from('quiz_pixels')
    .insert(pixel)
    .select('*')
    .single();

  if (error) throw error;
  return json(res, 201, {
    pixel: publicPixel(data),
    persisted: true
  });
});
