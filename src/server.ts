import { env } from './@env';
import { app } from './app';
import { httpLogger } from './lib/logger';

// Global error handlers
process.on('unhandledRejection', (reason) => {
  console.error('[FATAL] Unhandled promise rejection:', reason);
  process.exit(1);
});

process.on('uncaughtException', (error) => {
  console.error('[FATAL] Uncaught exception:', error);
  process.exit(1);
});

async function start() {
  try {
    await app.listen({
      host: '0.0.0.0',
      port: env.PORT,
    });
    httpLogger.info(
      { port: env.PORT },
      'HTTP server is running on port %d',
      env.PORT,
    );
  } catch (err) {
    console.error('[startup] Failed to start HTTP server:', err);
    httpLogger.error(err, 'Failed to start HTTP server');
    process.exit(1);
  }
}

start();
