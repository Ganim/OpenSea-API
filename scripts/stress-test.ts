/**
 * Stress test script for OpenSea API
 *
 * Usage:
 *   npx tsx scripts/stress-test.ts [options]
 *
 * Options:
 *   --url=<base-url>         Base URL (default: http://localhost:3333)
 *   --concurrent=<n>         Concurrent requests (default: 50)
 *   --duration=<seconds>     Test duration in seconds (default: 30)
 *   --endpoint=<path>        Endpoint to test (default: /health/live)
 *   --auth-email=<email>     Email for authentication
 *   --auth-password=<pwd>    Password for authentication
 *   --heavy                  Run heavy endpoints (file uploads, listings, etc.)
 */

const args = process.argv.slice(2);

function getArg(name: string, defaultValue: string): string {
  const arg = args.find((a) => a.startsWith(`--${name}=`));
  return arg ? arg.split('=')[1] : defaultValue;
}

const BASE_URL = getArg('url', 'http://localhost:3333');
const CONCURRENT = parseInt(getArg('concurrent', '50'));
const DURATION_S = parseInt(getArg('duration', '30'));
const ENDPOINT = getArg('endpoint', '/health/live');
const AUTH_EMAIL = getArg('auth-email', '');
const AUTH_PASSWORD = getArg('auth-password', '');
const HEAVY = args.includes('--heavy');

interface Stats {
  totalRequests: number;
  successCount: number;
  errorCount: number;
  statusCodes: Map<number, number>;
  responseTimes: number[];
  errors: Map<string, number>;
  startTime: number;
}

const stats: Stats = {
  totalRequests: 0,
  successCount: 0,
  errorCount: 0,
  statusCodes: new Map(),
  responseTimes: [],
  errors: new Map(),
  startTime: Date.now(),
};

let authToken = '';

async function authenticate(): Promise<string> {
  if (!AUTH_EMAIL || !AUTH_PASSWORD) return '';

  try {
    const res = await fetch(`${BASE_URL}/v1/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: AUTH_EMAIL, password: AUTH_PASSWORD }),
    });

    if (!res.ok) {
      console.error(`Auth failed: ${res.status} ${res.statusText}`);
      return '';
    }

    const data = (await res.json()) as { token?: string };
    return data.token ?? '';
  } catch (err) {
    console.error('Auth error:', err);
    return '';
  }
}

async function makeRequest(
  url: string,
  method = 'GET',
  body?: unknown,
): Promise<void> {
  const start = Date.now();

  try {
    const headers: Record<string, string> = {};
    if (authToken) headers['Authorization'] = `Bearer ${authToken}`;
    if (body) headers['Content-Type'] = 'application/json';

    const res = await fetch(url, {
      method,
      headers,
      body: body ? JSON.stringify(body) : undefined,
      signal: AbortSignal.timeout(10_000),
    });

    const elapsed = Date.now() - start;
    stats.totalRequests++;
    stats.responseTimes.push(elapsed);

    const code = res.status;
    stats.statusCodes.set(code, (stats.statusCodes.get(code) ?? 0) + 1);

    if (code >= 200 && code < 400) {
      stats.successCount++;
    } else {
      stats.errorCount++;
    }

    // Consume body to free resources
    await res.text();
  } catch (err) {
    const elapsed = Date.now() - start;
    stats.totalRequests++;
    stats.errorCount++;
    stats.responseTimes.push(elapsed);

    const errMsg =
      err instanceof Error ? err.message.split('\n')[0] : 'Unknown error';
    stats.errors.set(errMsg, (stats.errors.get(errMsg) ?? 0) + 1);
  }
}

function percentile(arr: number[], p: number): number {
  const sorted = [...arr].sort((a, b) => a - b);
  const idx = Math.ceil((p / 100) * sorted.length) - 1;
  return sorted[Math.max(0, idx)];
}

function printStats() {
  const elapsed = (Date.now() - stats.startTime) / 1000;
  const rps = stats.totalRequests / elapsed;

  console.log('\n' + '='.repeat(60));
  console.log('STRESS TEST RESULTS');
  console.log('='.repeat(60));
  console.log(`Duration:          ${elapsed.toFixed(1)}s`);
  console.log(`Total requests:    ${stats.totalRequests}`);
  console.log(`Requests/sec:      ${rps.toFixed(1)}`);
  console.log(`Success:           ${stats.successCount}`);
  console.log(`Errors:            ${stats.errorCount}`);
  console.log(
    `Error rate:        ${((stats.errorCount / stats.totalRequests) * 100).toFixed(1)}%`,
  );

  if (stats.responseTimes.length > 0) {
    const avg =
      stats.responseTimes.reduce((a, b) => a + b, 0) /
      stats.responseTimes.length;
    console.log(`\nResponse times:`);
    console.log(`  Average:         ${avg.toFixed(0)}ms`);
    console.log(`  P50:             ${percentile(stats.responseTimes, 50)}ms`);
    console.log(`  P90:             ${percentile(stats.responseTimes, 90)}ms`);
    console.log(`  P95:             ${percentile(stats.responseTimes, 95)}ms`);
    console.log(`  P99:             ${percentile(stats.responseTimes, 99)}ms`);
    console.log(
      `  Max:             ${Math.max(...stats.responseTimes)}ms`,
    );
  }

  if (stats.statusCodes.size > 0) {
    console.log(`\nStatus codes:`);
    for (const [code, count] of [...stats.statusCodes.entries()].sort()) {
      console.log(`  ${code}: ${count}`);
    }
  }

  if (stats.errors.size > 0) {
    console.log(`\nError types:`);
    for (const [msg, count] of [...stats.errors.entries()].sort(
      (a, b) => b[1] - a[1],
    )) {
      console.log(`  ${msg}: ${count}`);
    }
  }

  console.log('='.repeat(60));
}

// Heavy test endpoints (authenticated)
const HEAVY_ENDPOINTS = [
  { method: 'GET', path: '/health' },
  { method: 'GET', path: '/health/ready' },
  { method: 'GET', path: '/health/live' },
  { method: 'GET', path: '/v1/profile' },
];

async function runWorker(endTime: number): Promise<void> {
  while (Date.now() < endTime) {
    if (HEAVY && HEAVY_ENDPOINTS.length > 0) {
      const ep =
        HEAVY_ENDPOINTS[Math.floor(Math.random() * HEAVY_ENDPOINTS.length)];
      await makeRequest(`${BASE_URL}${ep.path}`, ep.method);
    } else {
      await makeRequest(`${BASE_URL}${ENDPOINT}`);
    }
  }
}

async function main() {
  console.log('OpenSea API Stress Test');
  console.log('-'.repeat(40));
  console.log(`Target:      ${BASE_URL}`);
  console.log(`Endpoint:    ${HEAVY ? 'multiple (heavy)' : ENDPOINT}`);
  console.log(`Concurrent:  ${CONCURRENT}`);
  console.log(`Duration:    ${DURATION_S}s`);
  console.log();

  // Authenticate if credentials provided
  if (AUTH_EMAIL) {
    console.log(`Authenticating as ${AUTH_EMAIL}...`);
    authToken = await authenticate();
    if (authToken) {
      console.log('Authenticated successfully');
    } else {
      console.log('Authentication failed, continuing without auth');
    }
  }

  // Check server is reachable
  try {
    const res = await fetch(`${BASE_URL}/health/live`, {
      signal: AbortSignal.timeout(5000),
    });
    if (!res.ok) {
      console.error(`Server returned ${res.status}. Is it running?`);
      process.exit(1);
    }
    console.log('Server is reachable. Starting test...\n');
  } catch {
    console.error(`Cannot reach ${BASE_URL}. Is the server running?`);
    process.exit(1);
  }

  stats.startTime = Date.now();
  const endTime = Date.now() + DURATION_S * 1000;

  // Progress reporter
  const progressInterval = setInterval(() => {
    const elapsed = ((Date.now() - stats.startTime) / 1000).toFixed(0);
    const rps = stats.totalRequests / ((Date.now() - stats.startTime) / 1000);
    process.stdout.write(
      `\r[${elapsed}s] requests=${stats.totalRequests} rps=${rps.toFixed(0)} errors=${stats.errorCount}`,
    );
  }, 1000);

  // Launch concurrent workers
  const workers: Promise<void>[] = [];
  for (let i = 0; i < CONCURRENT; i++) {
    workers.push(runWorker(endTime));
  }

  await Promise.all(workers);
  clearInterval(progressInterval);

  printStats();
}

main().catch((err) => {
  console.error('Fatal error:', err);
  process.exit(1);
});
