import { moduleLoadStart } from './startup-banner';
import { env } from './@env';
import { app } from './app';
import { prisma } from './lib/prisma';
import { httpLogger } from './lib/logger';

// Global error handlers
// NÃO usar process.exit(1) em unhandledRejection — erros temporários de Redis/IMAP
// são comuns e BullMQ/ioredis reconectam automaticamente. Matar o processo causa restart loop.
process.on('unhandledRejection', (reason) => {
  console.error('[ERROR] Unhandled promise rejection:', reason);
  // Log mas não mata o processo — permite reconexão automática de Redis/BullMQ
});

process.on('uncaughtException', (error) => {
  console.error('[FATAL] Uncaught exception:', error);
  // uncaughtException é mais grave — o estado do processo pode estar corrompido
  // Dá 1s para flush de logs antes de sair
  setTimeout(() => process.exit(1), 1000);
});

async function checkDatabaseConnection(): Promise<boolean> {
  try {
    await Promise.race([
      prisma.$queryRaw`SELECT 1`,
      new Promise((_, reject) =>
        setTimeout(() => reject(new Error('timeout')), 5000),
      ),
    ]);
    return true;
  } catch {
    return false;
  }
}

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
      '[startup] ⚠ Cannot connect to PostgreSQL! Make sure Docker is running:\n' +
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
    console.log(`[startup] Server ready on port ${env.PORT} (${elapsed}s)`);
    httpLogger.info(
      { port: env.PORT, startupMs: Date.now() - startTime },
      'HTTP server is running on port %d',
      env.PORT,
    );
  } catch (err) {
    const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
    console.error(`[startup] Failed after ${elapsed}s:`, err);
    httpLogger.error(err, 'Failed to start HTTP server');
    process.exit(1);
  }
}

start();
