const {
  getSupabase,
  json,
  findPixel,
  publicPixel,
  text,
  withMethods
} = require('../../lib/pixel-store');

function buildDiagnostics(pixel, latestDiagnostic) {
  const hasSignal = Boolean(pixel.last_event_at || pixel.last_heartbeat_at);
  const domainOk = pixel.status !== 'erro_dominio' && (latestDiagnostic ? latestDiagnostic.domain_ok !== false : true);
  return {
    script: {
      ok: latestDiagnostic ? Boolean(latestDiagnostic.script_ok) : hasSignal,
      label: latestDiagnostic ? (latestDiagnostic.script_ok ? 'OK' : 'Aguardando dados') : (hasSignal ? 'OK' : 'Aguardando dados')
    },
    endpoint: {
      ok: latestDiagnostic ? Boolean(latestDiagnostic.endpoint_ok) : true,
      label: latestDiagnostic ? (latestDiagnostic.endpoint_ok ? 'OK' : 'Aguardando dados') : 'OK'
    },
    database: { ok: true, label: 'OK' },
    domain: {
      ok: domainOk,
      label: domainOk ? (pixel.domain ? 'OK' : 'Aguardando dominio') : 'Erro de dominio'
    },
    last_error: latestDiagnostic?.last_error || null
  };
}

module.exports = withMethods(['GET'], async function handler(req, res) {
  const pixelId = text(req.query.pixel_id || req.query.funnel_id || req.query.quiz_id, 160);
  const publicKey = text(req.query.public_key, 180);
  if (!pixelId) return json(res, 400, { message: 'Missing pixel_id' });

  const supabase = getSupabase();
  if (!supabase) {
    return json(res, 200, {
      status: 'aguardando_instalacao',
      status_label: 'Aguardando instalacao',
      diagnostics: { database: { ok: false, label: 'Supabase nao configurado' } }
    });
  }

  try {
    const pixel = await findPixel(supabase, {
      pixel_id: pixelId,
      quiz_id: req.query.quiz_id,
      public_key: publicKey
    });

    if (!pixel) {
      return json(res, 404, {
        message: 'Pixel not found',
        status: 'aguardando_instalacao',
        status_label: 'Aguardando instalacao'
      });
    }

    const { data: latestDiagnostic } = await supabase
      .from('pixel_diagnostics')
      .select('*')
      .eq('pixel_id', pixel.pixel_id)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    return json(res, 200, {
      pixel: publicPixel(pixel),
      diagnostics: buildDiagnostics(pixel, latestDiagnostic)
    });
  } catch (error) {
    if (error.code === 'INVALID_PUBLIC_KEY') return json(res, 403, { message: error.message });
    console.error('[PixelManager] status failed', { pixel_id: pixelId, message: error.message });
    return json(res, 200, {
      status: 'aguardando_instalacao',
      status_label: 'Aguardando instalacao',
      diagnostics: { database: { ok: false, label: 'Supabase indisponivel' } }
    });
  }
});
