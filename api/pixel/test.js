const {
  json,
  normalizeEvent,
  parseBody,
  recordPixelEvent,
  validateEvent,
  withMethods
} = require('../../lib/pixel-store');

module.exports = withMethods(['POST'], async function handler(req, res) {
  const body = parseBody(req);
  const event = normalizeEvent({
    ...req,
    body: {
      ...body,
      event_name: 'integration_test',
      event_type: 'diagnostic',
      page_url: body.page_url || body.integrated_url || 'https://dashboard.gestordedados.local',
      payload: { source: 'dashboard_test' }
    }
  });

  const validationError = validateEvent(event);
  if (validationError) return json(res, 400, { message: validationError });

  try {
    const result = await recordPixelEvent(event);
    return json(res, 200, {
      message: 'Teste executado',
      result
    });
  } catch (error) {
    if (error.code === 'INVALID_PUBLIC_KEY') return json(res, 403, { message: error.message });
    throw error;
  }
});
