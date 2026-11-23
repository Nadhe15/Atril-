// netlify/functions/health.mjs
/**
 * Netlify Function v2 — Liveness Probe (`GET /health`) para ATRIL v5.0
 * Confirma que el entorno web en Netlify está activo y devuelve X-Correlation-Id.
 */
function createCorrelationId() {
  const ts = Date.now().toString(36);
  const rand = Math.random().toString(16).slice(2, 10).padEnd(8, '0');
  return `atril-hlth-${ts}-${rand}`;
}

export default async (request) => {
  const incoming = request?.headers?.get?.('x-correlation-id')?.trim();
  const correlationId = incoming || createCorrelationId();
  const environment = process.env.ATRIL_ENV || process.env.CONTEXT || 'staging';
  const timestamp = new Date().toISOString();

  const payload = {
    status: 'ok',
    service: 'atril-v5',
    version: '5.0.0',
    platform: 'netlify',
    environment,
    timestamp,
    correlationId,
  };

  console.log(
    JSON.stringify({
      timestamp,
      level: 'info',
      service: 'atril-v5',
      env: environment,
      correlationId,
      flow: 'observability',
      action: 'netlify_health_probe',
      statusCode: 200,
    })
  );

  return new Response(JSON.stringify(payload, null, 2), {
    status: 200,
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'X-Correlation-Id': correlationId,
      'Cache-Control': 'no-store',
    },
  });
};
