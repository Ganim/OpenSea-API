/* eslint-disable no-undef */
import { check, group, sleep } from 'k6';
import http from 'k6/http';
import { Counter, Rate, Trend } from 'k6/metrics';

const BASE_URL = __ENV.BASE_URL || 'http://localhost:3333';
const TEST_EMAIL = __ENV.TEST_EMAIL || 'admin@teste.com';
const TEST_PASSWORD = __ENV.TEST_PASSWORD || 'Teste@123';

const TARGET_ACCOUNT_ID = __ENV.EMAIL_ACCOUNT_ID || null;
const MARK_COUNT = Number(__ENV.MARK_COUNT || 200);
const OPEN_COUNT = Number(__ENV.OPEN_COUNT || 50);
const PAGE_SIZE = Number(__ENV.PAGE_SIZE || 100);
const MAX_PAGES = Number(__ENV.MAX_PAGES || 20);
const BULK_BATCH_SIZE = Number(__ENV.BULK_BATCH_SIZE || 20);

const markReadSuccess = new Rate('email_mark_read_success');
const markUnreadSuccess = new Rate('email_mark_unread_success');
const openSuccess = new Rate('email_open_success');
const markReadDuration = new Trend('email_mark_read_duration');
const markUnreadDuration = new Trend('email_mark_unread_duration');
const openDuration = new Trend('email_open_duration');
const markedReadCount = new Counter('email_marked_read_count');
const markedUnreadCount = new Counter('email_marked_unread_count');
const openedCount = new Counter('email_opened_count');

export const options = {
  scenarios: {
    email_bulk_and_open: {
      executor: 'per-vu-iterations',
      vus: Number(__ENV.VUS || 1),
      iterations: Number(__ENV.ITERATIONS || 1),
      maxDuration: __ENV.MAX_DURATION || '10m',
    },
  },
  thresholds: {
    http_req_failed: ['rate<0.15'],
    http_req_duration: ['p(95)<4000'],
    email_mark_read_success: ['rate>0.85'],
    email_mark_unread_success: ['rate>0.85'],
    email_open_success: ['rate>0.90'],
    email_mark_read_duration: ['p(95)<3000'],
    email_mark_unread_duration: ['p(95)<3000'],
    email_open_duration: ['p(95)<2500'],
  },
};

function authHeaders(token) {
  return {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${token}`,
  };
}

function selectTenantToken(baseToken) {
  const tenantsRes = http.get(`${BASE_URL}/v1/auth/tenants`, {
    headers: authHeaders(baseToken),
  });

  const hasTenantsEndpoint = tenantsRes.status === 200;
  if (!hasTenantsEndpoint) {
    return baseToken;
  }

  const tenants = tenantsRes.json('tenants') || [];
  if (!Array.isArray(tenants) || tenants.length === 0) {
    return baseToken;
  }

  const selectRes = http.post(
    `${BASE_URL}/v1/auth/select-tenant`,
    JSON.stringify({ tenantId: tenants[0].id }),
    { headers: authHeaders(baseToken) },
  );

  if (selectRes.status === 200 && selectRes.json('token')) {
    return selectRes.json('token');
  }

  return baseToken;
}

function listMessages(headers, accountId, desiredCount) {
  const ids = [];

  for (let page = 1; page <= MAX_PAGES; page += 1) {
    const res = http.get(
      `${BASE_URL}/v1/email/messages?accountId=${accountId}&page=${page}&limit=${PAGE_SIZE}`,
      { headers },
    );

    if (res.status !== 200) {
      break;
    }

    const data = res.json('data') || [];
    if (!Array.isArray(data) || data.length === 0) {
      break;
    }

    for (const message of data) {
      if (message?.id) {
        ids.push(message.id);
      }
    }

    if (ids.length >= desiredCount) {
      break;
    }

    const totalPages = res.json('meta.pages') || 1;
    if (page >= totalPages) {
      break;
    }
  }

  return ids;
}

function expandToCount(ids, targetCount) {
  if (ids.length === 0) return [];
  if (ids.length >= targetCount) return ids.slice(0, targetCount);

  const expanded = [...ids];
  let idx = 0;
  while (expanded.length < targetCount) {
    expanded.push(ids[idx % ids.length]);
    idx += 1;
  }

  return expanded;
}

function runMarkBatches(headers, messageIds, isRead) {
  let success = 0;

  for (let i = 0; i < messageIds.length; i += BULK_BATCH_SIZE) {
    const chunk = messageIds.slice(i, i + BULK_BATCH_SIZE);
    const requests = chunk.map((id) => ({
      method: 'PATCH',
      url: `${BASE_URL}/v1/email/messages/${id}/read`,
      body: JSON.stringify({ isRead }),
      params: { headers },
    }));

    const responses = http.batch(requests);

    for (const response of responses) {
      const ok = response.status === 204;
      success += ok ? 1 : 0;
      if (isRead) {
        markReadSuccess.add(ok);
        markReadDuration.add(response.timings.duration);
      } else {
        markUnreadSuccess.add(ok);
        markUnreadDuration.add(response.timings.duration);
      }
    }

    sleep(0.2);
  }

  return success;
}

export function setup() {
  const loginRes = http.post(
    `${BASE_URL}/v1/auth/login/password`,
    JSON.stringify({
      email: TEST_EMAIL,
      password: TEST_PASSWORD,
    }),
    {
      headers: { 'Content-Type': 'application/json' },
    },
  );

  check(loginRes, {
    'login ok': (r) => r.status === 200,
    'login token presente': (r) => Boolean(r.json('token')),
  });

  if (loginRes.status !== 200 || !loginRes.json('token')) {
    throw new Error('Falha no login para teste de carga de email');
  }

  const tenantToken = selectTenantToken(loginRes.json('token'));
  const headers = authHeaders(tenantToken);

  const accountsRes = http.get(`${BASE_URL}/v1/email/accounts`, { headers });
  check(accountsRes, {
    'list accounts status 200': (r) => r.status === 200,
  });

  if (accountsRes.status !== 200) {
    throw new Error('Falha ao listar contas de email');
  }

  const accounts = accountsRes.json('data') || [];
  const selectedAccount = TARGET_ACCOUNT_ID
    ? accounts.find((a) => a.id === TARGET_ACCOUNT_ID)
    : accounts[0];

  if (!selectedAccount) {
    throw new Error(
      'Nenhuma conta de email disponível. Defina EMAIL_ACCOUNT_ID ou crie uma conta com mensagens.',
    );
  }

  return {
    token: tenantToken,
    accountId: selectedAccount.id,
  };
}

export default function (data) {
  const headers = authHeaders(data.token);

  const messageIds = listMessages(
    headers,
    data.accountId,
    Math.max(MARK_COUNT, OPEN_COUNT),
  );
  check(
    { total: messageIds.length },
    {
      'mensagens disponíveis para teste': (obj) => obj.total > 0,
    },
  );

  if (messageIds.length === 0) {
    return;
  }

  const idsToMark = expandToCount(messageIds, MARK_COUNT);
  const idsToOpen = expandToCount(messageIds, OPEN_COUNT);

  group('Bulk mark read', () => {
    const success = runMarkBatches(headers, idsToMark, true);
    markedReadCount.add(success);
    check(
      { success, total: idsToMark.length },
      {
        'bulk read com sucesso >= 85%': (o) => o.success / o.total >= 0.85,
      },
    );
  });

  sleep(0.5);

  group('Bulk mark unread', () => {
    const success = runMarkBatches(headers, idsToMark, false);
    markedUnreadCount.add(success);
    check(
      { success, total: idsToMark.length },
      {
        'bulk unread com sucesso >= 85%': (o) => o.success / o.total >= 0.85,
      },
    );
  });

  sleep(0.5);

  group('Open messages', () => {
    let success = 0;
    for (const id of idsToOpen) {
      const res = http.get(`${BASE_URL}/v1/email/messages/${id}`, {
        headers,
      });

      const ok = res.status === 200 && Boolean(res.json('message.id'));
      success += ok ? 1 : 0;
      openSuccess.add(ok);
      openDuration.add(res.timings.duration);
      openedCount.add(ok ? 1 : 0);
    }

    check(
      { success, total: idsToOpen.length },
      {
        'open messages com sucesso >= 90%': (o) => o.success / o.total >= 0.9,
      },
    );
  });
}

export function handleSummary(data) {
  const metrics = data.metrics || {};

  const toPct = (value) => ((value || 0) * 100).toFixed(2);
  const p95 = (metricName) =>
    (metrics[metricName]?.values?.['p(95)'] || 0).toFixed(2);
  const count = (metricName) => metrics[metricName]?.values?.count || 0;

  const summaryText = `
================================================================================
                     EMAIL BULK + OPEN LOAD TEST SUMMARY
================================================================================

Configuração:
  - MARK_COUNT: ${MARK_COUNT}
  - OPEN_COUNT: ${OPEN_COUNT}
  - BULK_BATCH_SIZE: ${BULK_BATCH_SIZE}

Requests:
  - Total: ${count('http_reqs')}
  - Falhas: ${toPct(metrics.http_req_failed?.values?.rate)}%
  - Latência p95 (global): ${p95('http_req_duration')}ms

Bulk Marcação:
  - Sucesso marcar lido: ${toPct(metrics.email_mark_read_success?.values?.rate)}%
  - Sucesso marcar não lido: ${toPct(metrics.email_mark_unread_success?.values?.rate)}%
  - Latência p95 marcar lido: ${p95('email_mark_read_duration')}ms
  - Latência p95 marcar não lido: ${p95('email_mark_unread_duration')}ms

Abertura de Mensagens:
  - Sucesso abrir: ${toPct(metrics.email_open_success?.values?.rate)}%
  - Latência p95 abrir: ${p95('email_open_duration')}ms

Volume Efetivo:
  - Mensagens marcadas como lidas: ${count('email_marked_read_count')}
  - Mensagens marcadas como não lidas: ${count('email_marked_unread_count')}
  - Mensagens abertas: ${count('email_opened_count')}

================================================================================
`;

  return {
    'tests/load/reports/email-bulk-and-open-summary.json': JSON.stringify(data),
    stdout: summaryText,
  };
}
