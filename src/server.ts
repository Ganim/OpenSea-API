import { moduleLoadStart } from './startup-banner';
import { env } from './@env';
import { app } from './app';
import { prisma } from './lib/prisma';
import { httpLogger } from './lib/logger';
import { startEmailSyncWorker } from './workers/queues/email-sync.queue';
import {
  startEmailSyncScheduler,
  stopEmailSyncScheduler,
} from './workers/email-sync-scheduler';
import { startAuditWorker } from './workers/queues/audit.queue';
import { startNotificationWorker } from './workers/queues/notification.queue';
import { registerDomainEventSubscribers } from './lib/domain-event-subscribers';
import { closeAllQueues } from './lib/queue';
import { closeRedisConnection } from './lib/redis';
import { getImapConnectionPool } from './services/email/imap-connection-pool';

let isShuttingDown = false;
const SHUTDOWN_TIMEOUT_MS = 15_000;

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
    const timeoutId = setTimeout(() => {}, 5000);
    await Promise.race([
      prisma.$queryRaw`SELECT 1`,
      new Promise((_, reject) => {
        const timer = setTimeout(
          () => reject(new Error('Database connection timeout (5s)')),
          5000,
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
    // Stop schedulers first (prevent new jobs from being enqueued)
    stopEmailSyncScheduler();

    // Close HTTP server (stop accepting new connections)
    await app.close();
    console.log('[shutdown] HTTP server closed');

    // Close IMAP connection pool
    await getImapConnectionPool()
      .destroyAll()
      .catch(() => undefined);
    console.log('[shutdown] IMAP connections closed');

    // Close BullMQ queues and workers
    await closeAllQueues().catch(() => undefined);
    console.log('[shutdown] BullMQ queues closed');

    // Close Redis connection (lib/redis.ts singleton)
    await closeRedisConnection().catch(() => undefined);
    console.log('[shutdown] Redis disconnected');

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

    // Register domain event subscribers (cross-module side-effects)
    registerDomainEventSubscribers();

    // Start BullMQ workers inline (same process) so email sync, audit, and
    // notification queues are always consumed — even in development where
    // Dockerfile.worker doesn't run.
    // Set DISABLE_INLINE_WORKERS=true in .env to skip workers in dev
    // (useful when Redis is unavailable or to reduce memory pressure).
    if (env.DISABLE_INLINE_WORKERS) {
      console.log(
        '[startup] Inline workers disabled (DISABLE_INLINE_WORKERS=true)',
      );
    } else {
      try {
        startEmailSyncWorker();
        startNotificationWorker();
        startAuditWorker();
        await startEmailSyncScheduler();
        console.log(
          '[startup] Inline BullMQ workers + email sync scheduler started',
        );
      } catch (workerErr) {
        // Non-fatal: Redis may not be available, workers simply won't run
        console.warn(
          '[startup] Could not start inline workers (Redis unavailable?):',
          workerErr,
        );
      }
    }
  } catch (err) {
    const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
    console.error(`[startup] Failed after ${elapsed}s:`, err);
    httpLogger.error(err, 'Failed to start HTTP server');
    process.exit(1);
  }
}

start();
