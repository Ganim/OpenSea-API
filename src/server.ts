import { appendFileSync } from 'node:fs';
import { join } from 'node:path';
import { env } from './@env';
import { app } from './app';
import { getTypedEventBus } from './lib/events/typed-event-bus';
import { registerEventConsumers } from './lib/events/register-consumers';
import { httpLogger } from './lib/logger';
import { prisma } from './lib/prisma';
import {
  initializeSocketServer,
  getSocketServer,
} from './lib/websocket/socket-server';
import {
  startHeartbeatChecker,
  stopHeartbeatChecker,
} from './lib/websocket/heartbeat-checker';
import { moduleLoadStart } from './startup-banner';
import { getWorkflowScheduler } from './services/ai-workflows/workflow-scheduler';
import { getInsightScheduler } from './services/ai-insights/insight-scheduler';
import { getFinanceScheduler } from './services/finance/finance-scheduler';
import { BusinessSnapshotService } from './services/ai-tools/business-snapshot.service';

let isShuttingDown = false;
const SHUTDOWN_TIMEOUT_MS = 15_000;

// Crash log file — written synchronously so it survives process.exit()
const CRASH_LOG_PATH = join(process.cwd(), 'crash.log');

function writeCrashLog(label: string, reason: unknown): void {
  try {
    const mem = process.memoryUsage();
    const lines = [
      `\n========================================`,
      `[${new Date().toISOString()}] ${label}`,
      `Uptime: ${Math.round(process.uptime())}s`,
      `Heap: ${Math.round(mem.heapUsed / 1024 / 1024)}MB / ${Math.round(mem.heapTotal / 1024 / 1024)}MB  RSS: ${Math.round(mem.rss / 1024 / 1024)}MB`,
      reason instanceof Error
        ? `Error: ${reason.message}\nStack:\n${reason.stack}`
        : `Reason: ${String(reason)}`,
      `========================================`,
    ].join('\n');
    appendFileSync(CRASH_LOG_PATH, lines + '\n');
  } catch {
    // If writing to the crash log fails, there's nothing we can do
  }
}

// Global error handlers
// NÃO usar process.exit(1) em unhandledRejection — erros temporários de Redis/IMAP
// são comuns e BullMQ/ioredis reconectam automaticamente. Matar o processo causa restart loop.
process.on('unhandledRejection', (reason) => {
  const mem = process.memoryUsage();
  console.error('[ERROR] Unhandled promise rejection:', reason);
  console.error(
    '[ERROR] Memory at rejection: heap=%dMB rss=%dMB',
    Math.round(mem.heapUsed / 1024 / 1024),
    Math.round(mem.rss / 1024 / 1024),
  );
  writeCrashLog('UNHANDLED REJECTION', reason);
  // Log mas não mata o processo — permite reconexão automática de Redis/BullMQ
});

process.on('uncaughtException', (error) => {
  const mem = process.memoryUsage();
  console.error('[FATAL] Uncaught exception:', error);
  console.error(
    '[FATAL] Memory at crash: heap=%dMB rss=%dMB',
    Math.round(mem.heapUsed / 1024 / 1024),
    Math.round(mem.rss / 1024 / 1024),
  );
  console.error('[FATAL] Uptime: %ds', Math.round(process.uptime()));
  writeCrashLog('UNCAUGHT EXCEPTION', error);
  // uncaughtException é mais grave — o estado do processo pode estar corrompido
  // Dá 3s para flush de logs antes de sair
  setTimeout(() => process.exit(1), 3000);
});

// Memory pressure warning — log when heap exceeds threshold of max-old-space-size
// Using v8.getHeapStatistics().heap_size_limit as the real ceiling instead of
// heapTotal (which the GC shrinks dynamically, causing false 95%+ warnings).
const HEAP_WARNING_THRESHOLD = 0.8;
let lastHeapWarning = 0;
const heapCheckInterval = setInterval(async () => {
  const mem = process.memoryUsage();
  const { heap_size_limit } = (await import('node:v8')).getHeapStatistics();
  const heapRatio = mem.heapUsed / heap_size_limit;
  if (
    heapRatio > HEAP_WARNING_THRESHOLD &&
    Date.now() - lastHeapWarning > 60_000
  ) {
    lastHeapWarning = Date.now();
    const heapUsedMB = Math.round(mem.heapUsed / 1024 / 1024);
    const heapLimitMB = Math.round(heap_size_limit / 1024 / 1024);
    const rssMB = Math.round(mem.rss / 1024 / 1024);
    console.warn(
      `[MEMORY] High heap usage: ${heapUsedMB}MB / ${heapLimitMB}MB (${(heapRatio * 100).toFixed(1)}%) — rss=${rssMB}MB`,
    );
  }
}, 30_000);
heapCheckInterval.unref();

async function checkDatabaseConnection(): Promise<boolean> {
  try {
    const timeoutId = setTimeout(() => {}, 30000);
    await Promise.race([
      prisma.$queryRaw`SELECT 1`,
      new Promise((_, reject) => {
        const timer = setTimeout(
          () => reject(new Error('Database connection timeout (30s)')),
          30000,
        );
        timer.unref();
      }),
    ]);
    clearTimeout(timeoutId);
    return true;
  } catch (err) {
    console.error('[startup] Database check failed:', err);
    return false;
  }
}

async function gracefulShutdown(signal: string) {
  if (isShuttingDown) return;
  isShuttingDown = true;

  console.log(`[shutdown] ${signal} received. Starting graceful shutdown...`);
  httpLogger.info(`Graceful shutdown initiated by ${signal}`);

  const shutdownTimer = setTimeout(() => {
    console.error(
      `[shutdown] Timed out after ${SHUTDOWN_TIMEOUT_MS}ms, forcing exit`,
    );
    process.exit(1);
  }, SHUTDOWN_TIMEOUT_MS);
  shutdownTimer.unref();

  try {
    // Stop heartbeat checker
    stopHeartbeatChecker();

    // Close WebSocket server
    const wsServer = getSocketServer();
    if (wsServer) {
      wsServer.close();
      console.log('[shutdown] WebSocket server closed');
    }

    // Stop all schedulers
    getWorkflowScheduler().stop();
    getInsightScheduler().stop();
    getFinanceScheduler().stop();

    // Close HTTP server (stop accepting new connections)
    await app.close();
    console.log('[shutdown] HTTP server closed');

    // Close any BullMQ queues that may have been lazily created
    try {
      const { closeAllQueues } = await import('@/lib/queue');
      await closeAllQueues();
      console.log('[shutdown] Queue connections closed');
    } catch {
      // Queue module may not have been loaded
    }

    // Disconnect Prisma (release DB connections)
    await prisma.$disconnect();
    console.log('[shutdown] Database disconnected');
  } catch (err) {
    console.error('[shutdown] Error during shutdown:', err);
  } finally {
    clearTimeout(shutdownTimer);
    clearInterval(heapCheckInterval);
    console.log('[shutdown] Shutdown complete');
    process.exit(0);
  }
}

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

async function start() {
  const startTime = Date.now();
  const moduleLoadMs = startTime - moduleLoadStart;
  console.log(
    `[startup] Modules loaded (${(moduleLoadMs / 1000).toFixed(1)}s). Starting OpenSea API (${env.NODE_ENV})...`,
  );

  // Check database connectivity
  console.log('[startup] Checking database connection...');
  const dbOk = await checkDatabaseConnection();
  if (!dbOk) {
    console.error(
      '[startup] Cannot connect to PostgreSQL! Make sure Docker is running:\n' +
        '         docker compose up -d\n' +
        '         (or: docker-compose up -d)',
    );
    process.exit(1);
  }
  console.log('[startup] Database connected.');

  // Register cross-module event consumers
  console.log('[startup] Registering event consumers...');
  const eventBus = getTypedEventBus();
  registerEventConsumers(eventBus);
  console.log(
    `[startup] ${eventBus.getConsumers().length} event consumers registered.`,
  );

  try {
    console.log('[startup] Initializing plugins and routes...');
    await app.listen({
      host: '0.0.0.0',
      port: env.PORT,
    });

    const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
    const mem = process.memoryUsage();
    console.log(
      `[startup] Server ready on port ${env.PORT} (${elapsed}s) — heap=%dMB rss=%dMB`,
      Math.round(mem.heapUsed / 1024 / 1024),
      Math.round(mem.rss / 1024 / 1024),
    );
    httpLogger.info(
      { port: env.PORT, startupMs: Date.now() - startTime },
      'HTTP server is running on port %d',
      env.PORT,
    );

    // Initialize WebSocket server (attached to Fastify's HTTP server)
    const httpServer = app.server;
    initializeSocketServer(httpServer);
    startHeartbeatChecker();
    console.log('[startup] WebSocket server initialized');

    // Start AI workflow scheduler (CRON-based workflows)
    const scheduler = getWorkflowScheduler();
    scheduler.start();

    // Start AI insight scheduler (proactive insights every 6 hours)
    const insightScheduler = getInsightScheduler();
    insightScheduler.start();

    // Start finance scheduler (recurring entries, escalations, bank sync)
    const financeScheduler = getFinanceScheduler();
    financeScheduler.start();

    // Neon keep-alive ping — prevents Neon Free tier from suspending the
    // compute after 5 minutes of idle, which causes 1–3s cold-start latency
    // on the next query. Runs every 4 minutes with a lightweight SELECT 1.
    const NEON_KEEPALIVE_MS = 4 * 60 * 1000;
    setInterval(async () => {
      try {
        await prisma.$queryRaw`SELECT 1`;
      } catch (err) {
        console.error('[neon-keepalive] ping failed:', err);
      }
    }, NEON_KEEPALIVE_MS).unref();

    // Start business snapshot refresh (every 1 hour for active tenants)
    const snapshotService = new BusinessSnapshotService();
    const SNAPSHOT_INTERVAL_MS = 60 * 60 * 1000; // 1 hour
    setInterval(async () => {
      try {
        const tenants = await prisma.tenant.findMany({
          where: { status: 'ACTIVE' },
          select: { id: true },
        });
        for (const tenant of tenants) {
          await snapshotService.generate(tenant.id);
        }
      } catch (err) {
        console.error('[snapshot] Refresh failed:', err);
      }
    }, SNAPSHOT_INTERVAL_MS);
  } catch (err) {
    const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
    console.error(`[startup] Failed after ${elapsed}s:`, err);
    httpLogger.error(err, 'Failed to start HTTP server');
    process.exit(1);
  }
}

start();
