/* eslint-disable no-undef, @typescript-eslint/no-unused-vars */
import http from 'k6/http';
import { check, sleep, group } from 'k6';
import { Rate, Trend } from 'k6/metrics';

// Métricas customizadas
const loginSuccessRate = new Rate('login_success');
const loginDuration = new Trend('login_duration');
const refreshSuccessRate = new Rate('refresh_success');

// Configuração do teste
export const options = {
  scenarios: {
    auth_load: {
      executor: 'ramping-vus',
      startVUs: 0,
      stages: [
        { duration: '1m', target: 20 }, // Ramp up
        { duration: '3m', target: 20 }, // Sustain
        { duration: '1m', target: 50 }, // Increase
        { duration: '3m', target: 50 }, // Sustain
        { duration: '1m', target: 0 }, // Ramp down
      ],
    },
  },
  thresholds: {
    http_req_duration: ['p(95)<500'], // 95% < 500ms
    http_req_failed: ['rate<0.01'], // < 1% falhas
    login_success: ['rate>0.95'], // > 95% login sucesso
    login_duration: ['p(95)<300'], // 95% login < 300ms
    refresh_success: ['rate>0.99'], // > 99% refresh sucesso
  },
};

const BASE_URL = __ENV.BASE_URL || 'http://localhost:3333';

// Usuário de teste (deve existir no banco)
const TEST_USER = {
  email: __ENV.TEST_EMAIL || 'admin@teste.com',
  password: __ENV.TEST_PASSWORD || 'Teste@123',
};

export default function () {
  let token = null;
  let refreshToken = null;

  group('Login Flow', () => {
    // 1. Login
    const loginStart = Date.now();
    const loginRes = http.post(
      `${BASE_URL}/v1/auth/login/password`,
      JSON.stringify({
        email: TEST_USER.email,
        password: TEST_USER.password,
      }),
      {
        headers: { 'Content-Type': 'application/json' },
      },
    );
    loginDuration.add(Date.now() - loginStart);

    const loginSuccess = check(loginRes, {
      'login status is 200': (r) => r.status === 200,
      'login has token': (r) => r.json('token') !== undefined,
    });
    loginSuccessRate.add(loginSuccess);

    if (loginSuccess) {
      token = loginRes.json('token');
      // Refresh token está no cookie
      const cookies = loginRes.cookies;
      if (cookies && cookies.refreshToken) {
        refreshToken = cookies.refreshToken[0].value;
      }
    }
  });

  sleep(1);

  if (token) {
    group('Authenticated Requests', () => {
      // 2. Buscar dados do usuário autenticado
      const meRes = http.get(`${BASE_URL}/v1/me`, {
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
      });

      check(meRes, {
        'get me status is 200': (r) => r.status === 200,
        'get me has user data': (r) => r.json('id') !== undefined,
      });

      sleep(0.5);

      // 3. Listar produtos (se tiver permissão)
      const productsRes = http.get(`${BASE_URL}/v1/products?page=1&limit=10`, {
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
      });

      check(productsRes, {
        'list products status is 200 or 403': (r) =>
          r.status === 200 || r.status === 403,
      });
    });

    sleep(1);

    group('Token Refresh', () => {
      // 4. Refresh token
      const refreshRes = http.post(`${BASE_URL}/v1/sessions/refresh`, null, {
        headers: {
          'Content-Type': 'application/json',
          Cookie: `refreshToken=${refreshToken}`,
        },
      });

      const refreshSuccess = check(refreshRes, {
        'refresh status is 200': (r) => r.status === 200,
        'refresh has new token': (r) => r.json('token') !== undefined,
      });
      refreshSuccessRate.add(refreshSuccess);
    });
  }

  sleep(2);
}

export function handleSummary(data) {
  return {
    'tests/load/reports/auth-flow-summary.json': JSON.stringify(data),
    stdout: textSummary(data, { indent: ' ', enableColors: true }),
  };
}

function textSummary(data, options) {
  const { metrics, root_group } = data;

  let summary = `
================================================================================
                           AUTH FLOW LOAD TEST SUMMARY
================================================================================

Iterations: ${metrics.iterations.values.count}
Duration: ${(metrics.iteration_duration.values.avg / 1000).toFixed(2)}s avg

HTTP Requests:
  - Total: ${metrics.http_reqs.values.count}
  - Failed: ${(metrics.http_req_failed.values.rate * 100).toFixed(2)}%
  - Duration (p95): ${metrics.http_req_duration.values['p(95)'].toFixed(2)}ms

Custom Metrics:
  - Login Success Rate: ${(metrics.login_success?.values.rate * 100 || 0).toFixed(2)}%
  - Login Duration (p95): ${(metrics.login_duration?.values['p(95)'] || 0).toFixed(2)}ms
  - Refresh Success Rate: ${(metrics.refresh_success?.values.rate * 100 || 0).toFixed(2)}%

Thresholds:
`;

  for (const [name, threshold] of Object.entries(data.thresholds || {})) {
    const status = threshold.ok ? '✓' : '✗';
    summary += `  ${status} ${name}\n`;
  }

  summary += `
================================================================================
`;

  return summary;
}
