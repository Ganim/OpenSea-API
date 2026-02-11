// Global error handlers - must be registered before any other code
process.on('unhandledRejection', (reason) => {
  console.error('[FATAL] Unhandled promise rejection:', reason);
  process.exit(1);
});

process.on('uncaughtException', (error) => {
  console.error('[FATAL] Uncaught exception:', error);
  process.exit(1);
});

console.log('[startup] Loading environment...');
import { env } from './@env';
console.log('[startup] Environment loaded, PORT=%d', env.PORT);

console.log('[startup] Loading app...');
import { app } from './app';
console.log('[startup] App loaded');

import { httpLogger } from './lib/logger';

async function start() {
  try {
    console.log('[startup] Calling app.listen on 0.0.0.0:%d...', env.PORT);
    await app.listen({
      host: '0.0.0.0',
      port: env.PORT,
    });
    httpLogger.info(
      { port: env.PORT },
      'HTTP server is running on port %d',
      env.PORT,
    );
    console.log('[startup] Server is running on port %d', env.PORT);
  } catch (err) {
    console.error('[startup] Failed to start HTTP server:', err);
    httpLogger.error(err, 'Failed to start HTTP server');
    process.exit(1);
  }
}

start();
