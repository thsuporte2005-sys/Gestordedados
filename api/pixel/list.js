const {
  getSupabase,
  json,
  publicPixel,
  withMethods
} = require('../../lib/pixel-store');

module.exports = withMethods(['GET'], async function handler(req, res) {
  const supabase = getSupabase();
  if (!supabase) {
    return json(res, 200, {
      pixels: [],
      diagnostics: { database: { ok: false, label: 'Supabase nao configurado' } }
    });
  }

  const { data, error } = await supabase
    .from('quiz_pixels')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) throw error;
  return json(res, 200, {
    pixels: (data || []).map(publicPixel),
    diagnostics: { database: { ok: true, label: 'OK' } }
  });
});
