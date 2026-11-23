// netlify/functions/ready.mjs
/**
 * Netlify Function v2 — Readiness Probe (`GET /ready`) para ATRIL v5.0
 * Verifica que las variables de Supabase estén configuradas (sin exponer secretos)
 * y ejecuta una sonda real ligera contra Supabase Auth y PostgREST (`usuarios` y `perfiles_profesores`).
 */
function createCorrelationId() {
  const ts = Date.now().toString(36);
  const rand = Math.random().toString(16).slice(2, 10).padEnd(8, '0');
  return `atril-rdy-${ts}-${rand}`;
}

function cleanEnvValue(raw) {
  return (raw || '').trim().replace(/^["']|["']$/g, '');
}

async function fetchWithTimeout(url, headers, timeoutMs = 5000) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(url, { method: 'GET', headers, signal: controller.signal });
  } finally {
    clearTimeout(timer);
  }
}

export default async (request) => {
  const incoming = request?.headers?.get?.('x-correlation-id')?.trim();
  const correlationId = incoming || createCorrelationId();
  const environment = process.env.ATRIL_ENV || process.env.CONTEXT || 'staging';
  const timestamp = new Date().toISOString();

  const supabaseUrl = cleanEnvValue(process.env.EXPO_PUBLIC_SUPABASE_URL).replace(/\/+$/, '');
  const supabaseKey = cleanEnvValue(process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY);

  const isPlaceholder =
    supabaseUrl.includes('tu-proyecto-pruebas') ||
    supabaseKey.includes('clave_sintetica_ejemplo');

  const envOk =
    !isPlaceholder &&
    supabaseUrl.startsWith('https://') &&
    supabaseUrl.includes('.supabase.co') &&
    supabaseKey.length >= 16;

  let authCheck = {
    ok: false,
    detail: 'Verificación omitida por configuración incompleta.',
  };
  let databaseCheck = {
    ok: false,
    detail: 'Consulta a PostgreSQL/PostgREST omitida por configuración incompleta.',
  };

  if (envOk) {
    const sbHeaders = {
      apikey: supabaseKey,
      Authorization: `Bearer ${supabaseKey}`,
      Accept: 'application/json',
    };

    try {
      const authRes = await fetchWithTimeout(`${supabaseUrl}/auth/v1/settings`, sbHeaders);
      if (authRes.ok) {
        authCheck = {
          ok: true,
          detail: `Supabase Auth operativo (HTTP ${authRes.status}).`,
        };
      } else {
        authCheck = {
          ok: false,
          detail: `Supabase Auth respondió HTTP ${authRes.status}. Verifica EXPO_PUBLIC_SUPABASE_ANON_KEY.`,
        };
      }
    } catch (err) {
      authCheck = {
        ok: false,
        detail: `No se pudo contactar Supabase Auth: ${err instanceof Error ? err.message : 'timeout/red'}.`,
      };
    }

    try {
      const [usuariosRes, profesoresRes] = await Promise.all([
        fetchWithTimeout(`${supabaseUrl}/rest/v1/usuarios?select=id&limit=1`, sbHeaders),
        fetchWithTimeout(
          `${supabaseUrl}/rest/v1/perfiles_profesores?select=id&limit=1`,
          sbHeaders
        ),
      ]);

      const problemas = [];

      if (!usuariosRes.ok) {
        const bodyText = await usuariosRes.text().catch(() => '');
        if (bodyText.includes('42P17') || bodyText.includes('infinite recursion')) {
          problemas.push(
            'tabla public.usuarios con recursión infinita en RLS (42P17) — ejecutar supabase/migrations/20261123_v5_fix_rls_and_profesores.sql en Supabase SQL Editor'
          );
        } else {
          problemas.push(`public.usuarios HTTP ${usuariosRes.status}`);
        }
      }

      if (!profesoresRes.ok) {
        const bodyText = await profesoresRes.text().catch(() => '');
        if (bodyText.includes('PGRST205') || profesoresRes.status === 404) {
          problemas.push(
            'tabla public.perfiles_profesores no encontrada (PGRST205) — ejecutar supabase/migrations/20261123_v5_fix_rls_and_profesores.sql en Supabase SQL Editor'
          );
        } else {
          problemas.push(`public.perfiles_profesores HTTP ${profesoresRes.status}`);
        }
      }

      if (problemas.length === 0) {
        databaseCheck = {
          ok: true,
          detail: 'PostgREST/PostgreSQL operativo en public.usuarios y public.perfiles_profesores.',
        };
      } else {
        databaseCheck = {
          ok: false,
          detail: `Esquema/RLS pendiente en Supabase: ${problemas.join('; ')}.`,
        };
      }
    } catch (err) {
      databaseCheck = {
        ok: false,
        detail: `Error consultando PostgREST en Supabase: ${err instanceof Error ? err.message : 'timeout/red'}.`,
      };
    }
  }

  const isReady = envOk && authCheck.ok && databaseCheck.ok;
  const httpStatus = isReady ? 200 : 503;

  const payload = {
    status: isReady ? 'ready' : 'not_ready',
    service: 'atril-v5',
    version: '5.0.0',
    platform: 'netlify',
    environment,
    checks: {
      envConfig: {
        ok: envOk,
        detail: envOk
          ? 'Variables EXPO_PUBLIC_SUPABASE_URL y EXPO_PUBLIC_SUPABASE_ANON_KEY configuradas en Netlify.'
          : isPlaceholder
          ? 'Se detectaron valores de ejemplo (placeholder) en EXPO_PUBLIC_SUPABASE_URL / ANON_KEY. Reemplázalos en Netlify Environment Variables.'
          : 'Faltan variables EXPO_PUBLIC_SUPABASE_URL o EXPO_PUBLIC_SUPABASE_ANON_KEY en Netlify Environment Variables.',
      },
      supabaseAuth: authCheck,
      database: databaseCheck,
    },
    timestamp,
    correlationId,
  };

  console.log(
    JSON.stringify({
      timestamp,
      level: isReady ? 'info' : 'warn',
      service: 'atril-v5',
      env: environment,
      correlationId,
      flow: 'observability',
      action: 'netlify_readiness_probe',
      statusCode: httpStatus,
      ready: isReady,
      envOk,
      authOk: authCheck.ok,
      dbOk: databaseCheck.ok,
    })
  );

  return new Response(JSON.stringify(payload, null, 2), {
    status: httpStatus,
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'X-Correlation-Id': correlationId,
      'Cache-Control': 'no-store',
    },
  });
};
