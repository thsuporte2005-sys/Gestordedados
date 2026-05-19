const {
  findPixel,
  getSupabase,
  json,
  parseBody,
  text,
  withMethods
} = require('../../lib/pixel-store');

module.exports = withMethods(['DELETE', 'POST'], async function handler(req, res) {
  const body = parseBody(req);
  const pixelId = text(body.pixel_id || req.query.pixel_id, 160);
  const publicKey = text(body.public_key || req.query.public_key, 180);
  if (!pixelId) return json(res, 400, { message: 'Missing pixel_id' });

  const supabase = getSupabase();
  if (!supabase) return json(res, 503, { message: 'Supabase nao configurado' });

  const pixel = await findPixel(supabase, { pixel_id: pixelId, public_key: publicKey });
  if (!pixel) return json(res, 404, { message: 'Pixel not found' });

  await supabase.from('pixel_diagnostics').delete().eq('pixel_id', pixelId);
  await supabase.from('pixel_events').delete().eq('pixel_id', pixelId);
  const { error } = await supabase.from('quiz_pixels').delete().eq('pixel_id', pixelId);
  if (error) throw error;

  return json(res, 200, { deleted: true, pixel_id: pixelId });
});
