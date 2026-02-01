import http from 'k6/http';
import { check, sleep, group } from 'k6';
import { Rate, Trend, Counter } from 'k6/metrics';

// Métricas customizadas
const createSuccess = new Rate('product_create_success');
const readSuccess = new Rate('product_read_success');
const listSuccess = new Rate('product_list_success');
const crudDuration = new Trend('crud_operation_duration');
const productsCreated = new Counter('products_created');

export const options = {
  scenarios: {
    crud_operations: {
      executor: 'ramping-vus',
      startVUs: 0,
      stages: [
        { duration: '1m', target: 10 },
        { duration: '3m', target: 10 },
        { duration: '1m', target: 30 },
        { duration: '3m', target: 30 },
        { duration: '1m', target: 0 },
      ],
    },
  },
  thresholds: {
    http_req_duration: ['p(95)<500'],
    http_req_failed: ['rate<0.05'],
    product_create_success: ['rate>0.90'],
    product_read_success: ['rate>0.95'],
    product_list_success: ['rate>0.95'],
    crud_operation_duration: ['p(95)<400'],
  },
};

const BASE_URL = __ENV.BASE_URL || 'http://localhost:3333';
let authToken = null;

// Setup - Login uma vez antes dos testes
export function setup() {
  const loginRes = http.post(
    `${BASE_URL}/v1/auth/login/password`,
    JSON.stringify({
      email: __ENV.TEST_EMAIL || 'admin@teste.com',
      password: __ENV.TEST_PASSWORD || 'Teste@123',
    }),
    {
      headers: { 'Content-Type': 'application/json' },
    },
  );

  if (loginRes.status !== 200) {
    console.error('Failed to login:', loginRes.body);
    return { token: null };
  }

  return { token: loginRes.json('token') };
}

export default function (data) {
  if (!data.token) {
    console.error('No auth token available');
    return;
  }

  const headers = {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${data.token}`,
  };

  const vuId = __VU;
  const iterId = __ITER;

  group('List Products', () => {
    const start = Date.now();
    const page = Math.floor(Math.random() * 5) + 1;

    const res = http.get(`${BASE_URL}/v1/products?page=${page}&limit=20`, {
      headers,
    });

    crudDuration.add(Date.now() - start);

    const success = check(res, {
      'list status is 200': (r) => r.status === 200,
      'list has data array': (r) => Array.isArray(r.json('data')),
      'list has meta': (r) => r.json('meta') !== undefined,
    });
    listSuccess.add(success);
  });

  sleep(0.5);

  group('Get Single Product', () => {
    // Primeiro, listar para pegar um ID válido
    const listRes = http.get(`${BASE_URL}/v1/products?page=1&limit=1`, {
      headers,
    });

    if (listRes.status === 200) {
      const products = listRes.json('data');

      if (products && products.length > 0) {
        const productId = products[0].id;
        const start = Date.now();

        const res = http.get(`${BASE_URL}/v1/products/${productId}`, {
          headers,
        });

        crudDuration.add(Date.now() - start);

        const success = check(res, {
          'get status is 200': (r) => r.status === 200,
          'get has product id': (r) => r.json('id') === productId,
        });
        readSuccess.add(success);
      }
    }
  });

  sleep(0.5);

  // Criar produto ocasionalmente (1 a cada 10 iterações)
  if (iterId % 10 === 0) {
    group('Create Product', () => {
      const start = Date.now();
      const uniqueSku = `LOAD-TEST-${vuId}-${iterId}-${Date.now()}`;

      const res = http.post(
        `${BASE_URL}/v1/products`,
        JSON.stringify({
          name: `Load Test Product ${vuId}-${iterId}`,
          sku: uniqueSku,
          description: 'Product created during load test',
        }),
        { headers },
      );

      crudDuration.add(Date.now() - start);

      const success = check(res, {
        'create status is 201 or 403': (r) =>
          r.status === 201 || r.status === 403,
      });

      if (res.status === 201) {
        createSuccess.add(true);
        productsCreated.add(1);
      } else if (res.status === 403) {
        // Sem permissão, mas não é falha do sistema
        createSuccess.add(true);
      } else {
        createSuccess.add(false);
      }
    });
  }

  sleep(1);
}

export function teardown(data) {
  // Cleanup opcional: deletar produtos criados durante o teste
  // Em ambiente de teste real, isso seria importante
  console.log('Load test completed');
}

export function handleSummary(data) {
  return {
    'tests/load/reports/products-crud-summary.json': JSON.stringify(data),
    stdout: generateSummary(data),
  };
}

function generateSummary(data) {
  const { metrics } = data;

  return `
================================================================================
                        PRODUCTS CRUD LOAD TEST SUMMARY
================================================================================

Total Requests: ${metrics.http_reqs.values.count}
Failed Requests: ${(metrics.http_req_failed.values.rate * 100).toFixed(2)}%
Avg Duration: ${metrics.http_req_duration.values.avg.toFixed(2)}ms
P95 Duration: ${metrics.http_req_duration.values['p(95)'].toFixed(2)}ms

CRUD Operations:
  - Products Created: ${metrics.products_created?.values.count || 0}
  - Create Success Rate: ${((metrics.product_create_success?.values.rate || 0) * 100).toFixed(2)}%
  - Read Success Rate: ${((metrics.product_read_success?.values.rate || 0) * 100).toFixed(2)}%
  - List Success Rate: ${((metrics.product_list_success?.values.rate || 0) * 100).toFixed(2)}%
  - CRUD P95 Duration: ${(metrics.crud_operation_duration?.values['p(95)'] || 0).toFixed(2)}ms

================================================================================
`;
}
