/* eslint-disable no-undef */
/**
 * Configuração base do k6 para testes de carga
 *
 * Uso:
 *   k6 run tests/load/scenarios/auth-flow.js
 *   k6 run --env BASE_URL=http://localhost:3333 tests/load/scenarios/auth-flow.js
 */

export const baseConfig = {
  // Configuração de ambiente
  env: {
    BASE_URL: __ENV.BASE_URL || 'http://localhost:3333',
  },

  // Thresholds padrão
  thresholds: {
    // 95% das requisições devem completar em menos de 500ms
    http_req_duration: ['p(95)<500'],
    // Menos de 1% de falhas
    http_req_failed: ['rate<0.01'],
    // Tempo de espera máximo de 200ms
    http_req_waiting: ['p(95)<200'],
  },
};

/**
 * Cenários pré-definidos
 */
export const scenarios = {
  // Teste de fumaça - verificação básica
  smoke: {
    executor: 'constant-vus',
    vus: 1,
    duration: '1m',
  },

  // Teste de carga normal
  load: {
    executor: 'ramping-vus',
    startVUs: 0,
    stages: [
      { duration: '2m', target: 50 }, // Ramp up
      { duration: '5m', target: 50 }, // Sustain
      { duration: '2m', target: 0 }, // Ramp down
    ],
  },

  // Teste de estresse
  stress: {
    executor: 'ramping-vus',
    startVUs: 0,
    stages: [
      { duration: '2m', target: 100 }, // Ramp up
      { duration: '5m', target: 100 }, // Sustain
      { duration: '2m', target: 200 }, // Push to stress
      { duration: '5m', target: 200 }, // Sustain stress
      { duration: '2m', target: 0 }, // Ramp down
    ],
  },

  // Teste de pico
  spike: {
    executor: 'ramping-vus',
    startVUs: 0,
    stages: [
      { duration: '1m', target: 10 }, // Warm up
      { duration: '10s', target: 500 }, // Spike!
      { duration: '2m', target: 500 }, // Sustain spike
      { duration: '10s', target: 10 }, // Scale down
      { duration: '1m', target: 0 }, // Recovery
    ],
  },

  // Teste de resistência (soak)
  soak: {
    executor: 'constant-vus',
    vus: 50,
    duration: '30m',
  },
};

/**
 * Headers padrão para requisições autenticadas
 */
export function getAuthHeaders(token) {
  return {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${token}`,
  };
}

/**
 * Headers padrão para requisições públicas
 */
export function getPublicHeaders() {
  return {
    'Content-Type': 'application/json',
  };
}
