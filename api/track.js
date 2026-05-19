const {
  json,
  normalizeEvent,
  recordPixelEvent,
  validateEvent,
  withMethods
} = require('../lib/pixel-store');

module.exports = withMethods(['POST', 'GET'], async function handler(req, res) {
  if (req.method === 'GET') {
    return json(res, 200, {
      message: 'Pixel API online',
      endpoints: {
        track: 'POST /api/track',
        status: 'GET /api/pixel/status?pixel_id=...',
        list: 'GET /api/pixel/list'
      }
    });
  }

  const event = normalizeEvent(req);
  const validationError = validateEvent(event);
  if (validationError) return json(res, 400, { message: validationError });

  json(res, 200, {
    accepted: true,
    message: 'Evento aceito para processamento',
    pixel_id: event.pixel_id,
    event_name: event.event_name,
    received_at: event.received_at,
    status_url: `/api/pixel/status?pixel_id=${encodeURIComponent(event.pixel_id)}`
  });

  const task = recordPixelEvent(event).catch((error) => {
    console.error('[PixelManager] background processing failed', {
      pixel_id: event.pixel_id,
      event_name: event.event_name,
      message: error.message
    });
  });

  if (process.env.PIXEL_SYNC_WRITES === '1') await task;
});
