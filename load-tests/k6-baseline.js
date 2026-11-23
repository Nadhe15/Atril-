// load-tests/k6-baseline.js
/**
 * Prueba de Carga de Línea Base — ATRIL v5.0 (Sprint 1)
 * Herramienta: k6 (https://k6.io)
 * Ejecución: k6 run load-tests/k6-baseline.js
 *
 * Evalúa el RNF-01 del proyecto ATRIL:
 * - p95 < 500 ms (meta estricta del Laboratorio 6) y p95 < 1500 ms (RNF-01 en redes móviles)
 * - 50 usuarios concurrentes (línea base) + rampa de estrés a 100 usuarios concurrentes
 * - Tasa de fallos HTTP < 1%
 */
import http from 'k6/http';
import { check, sleep } from 'k6';

const BASE_URL = __ENV.ATRIL_STAGING_URL || 'http://localhost:8081';

export const options = {
  stages: [
    { duration: '20s', target: 50 },  // Rampa a 50 usuarios concurrentes (RNF-01)
    { duration: '40s', target: 50 },  // Sostenido en 50 usuarios concurrentes
    { duration: '20s', target: 100 }, // Pico de estrés a 100 usuarios (recomendación Profa. Marla)
    { duration: '15s', target: 0 },   // Enfriamiento
  ],
  thresholds: {
    http_req_duration: ['p(95)<500', 'p(99)<1500'],
    http_req_failed: ['rate<0.01'],
  },
};

export default function () {
  const res = http.get(`${BASE_URL}/`, {
    tags: { flujo: 'catalogo_y_landing_v5' },
  });

  check(res, {
    'HTTP status 200 OK': (r) => r.status === 200,
    'Tiempo de respuesta < 500ms': (r) => r.timings.duration < 500,
  });

  sleep(1);
}
