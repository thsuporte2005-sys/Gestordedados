const {
  findPixel,
  getSupabase,
  json,
  parseBody,
  publicPixel,
  text,
  withMethods
} = require('../../lib/pixel-store');

module.exports = withMethods(['PATCH', 'POST'], async function handler(req, res) {
  const body = parseBody(req);
  const pixelId = text(body.pixel_id, 160);
  const publicKey = text(body.public_key, 180);
  if (!pixelId) return json(res, 400, { message: 'Missing pixel_id' });

  const supabase = getSupabase();
  if (!supabase) return json(res, 503, { message: 'Supabase nao configurado' });

  const pixel = await findPixel(supabase, { pixel_id: pixelId, public_key: publicKey });
  if (!pixel) return json(res, 404, { message: 'Pixel not found' });

  const update = {
    updated_at: new Date().toISOString()
  };
  if (body.quiz_name !== undefined) update.quiz_name = text(body.quiz_name, 180) || pixel.quiz_name;
  if (body.domain !== undefined) update.domain = text(body.domain, 300);
  if (body.integrated_url !== undefined) update.integrated_url = text(body.integrated_url, 1200);
  if (body.status !== undefined) update.status = text(body.status, 80);
  if (body.regenerate_key === true || body.regenerate_key === 'true') {
    update.public_key = `pk_live_${Math.random().toString(36).slice(2, 18)}${Date.now().toString(36).slice(-4)}`;
    update.status = 'aguardando_instalacao';
    update.last_event_at = null;
    update.last_heartbeat_at = null;
  }

  const { data, error } = await supabase
    .from('quiz_pixels')
    .update(update)
    .eq('pixel_id', pixelId)
    .select('*')
    .single();

  if (error) throw error;
  return json(res, 200, { pixel: publicPixel(data) });
});
