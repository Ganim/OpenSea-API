/* eslint-disable no-undef */
/**
 * Smoke Test - Verificação básica de saúde do sistema
 *
 * Este teste verifica se os endpoints críticos estão funcionando.
 * Deve ser executado antes de qualquer deploy ou teste mais intensivo.
 *
 * Uso:
 *   k6 run tests/load/smoke.js
 *   k6 run --env BASE_URL=http://staging.api.com tests/load/smoke.js
 */

import http from 'k6/http';
import { check, sleep } from 'k6';

export const options = {
  vus: 1,
  duration: '1m',
  thresholds: {
    http_req_duration: ['p(99)<1000'], // 99% < 1s
    // Excluir erros esperados (login com credenciais inválidas retorna 400/401)
    'http_req_failed{expected_error:!true}': ['rate<0.01'], // < 1% falhas (excluindo erros esperados)
  },
};

const BASE_URL = __ENV.BASE_URL || 'http://localhost:3333';

export default function () {
  // 1. Health Check
  const healthRes = http.get(`${BASE_URL}/health`);
  check(healthRes, {
    'health check returns 200': (r) => r.status === 200,
    'health check status is healthy': (r) => {
      const body = r.json();
      return body.status === 'healthy' || body.status === 'degraded';
    },
    'health check has database status': (r) => {
      const body = r.json();
      return body.checks && body.checks.database !== undefined;
    },
  });

  sleep(1);

  // 2. Liveness Probe
  const liveRes = http.get(`${BASE_URL}/health/live`);
  check(liveRes, {
    'liveness returns 200': (r) => r.status === 200,
    'liveness status is alive': (r) => r.json('status') === 'alive',
  });

  sleep(1);

  // 3. Readiness Probe
  const readyRes = http.get(`${BASE_URL}/health/ready`);
  check(readyRes, {
    'readiness returns 200': (r) => r.status === 200,
    'readiness status is ready': (r) => r.json('status') === 'ready',
  });

  sleep(1);

  // 4. Login endpoint disponível (sem credenciais válidas)
  // Esperamos 400/401 para credenciais inválidas - isso é comportamento correto
  const loginRes = http.post(
    `${BASE_URL}/v1/auth/login/password`,
    JSON.stringify({
      email: 'nonexistent@test.com',
      password: 'WrongPassword123!',
    }),
    {
      headers: { 'Content-Type': 'application/json' },
      tags: { expected_error: 'true' }, // Tag para identificar erros esperados
    },
  );
  check(loginRes, {
    'login endpoint responds': (r) => r.status === 401 || r.status === 400,
  });

  sleep(1);

  // 5. Swagger/Docs disponível
  const docsRes = http.get(`${BASE_URL}/docs`);
  check(docsRes, {
    'docs endpoint returns 200': (r) => r.status === 200,
  });

  sleep(2);
}

export function handleSummary(data) {
  const passed = Object.values(data.metrics)
    .filter((m) => m.thresholds)
    .every((m) => Object.values(m.thresholds).every((t) => t.ok));

  // Calcular falhas reais (excluindo erros esperados como login 400/401)
  const totalRequests = data.metrics.http_reqs.values.count;
  const expectedErrors = totalRequests / 5; // 1 login request por cada 5 requests
  const realFailures =
    data.metrics.http_req_failed.values.rate * totalRequests - expectedErrors;
  const realFailureRate =
    Math.max(0, realFailures / (totalRequests - expectedErrors)) * 100;

  console.log(`\n${'='.repeat(60)}`);
  console.log('                    SMOKE TEST RESULTS');
  console.log('='.repeat(60));
  console.log(`\nStatus: ${passed ? '✓ PASSED' : '✗ FAILED'}`);
  console.log(`Total Requests: ${totalRequests}`);
  console.log(`Expected Errors (login 400): ${Math.round(expectedErrors)}`);
  console.log(`Real Failure Rate: ${realFailureRate.toFixed(2)}%`);
  console.log(
    `Avg Duration: ${data.metrics.http_req_duration.values.avg.toFixed(2)}ms`,
  );
  console.log('='.repeat(60) + '\n');

  return {
    'tests/load/reports/smoke-summary.json': JSON.stringify(data),
  };
}
