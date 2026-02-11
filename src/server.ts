import { env } from './@env';
import { app } from './app';
import { httpLogger } from './lib/logger';

app
  .listen({
    host: '0.0.0.0',
    port: env.PORT,
  })
  .then(() => {
    httpLogger.info(
      { port: env.PORT },
      'HTTP server is running on port %d',
      env.PORT,
    );
    httpLogger.info(
      { docsUrl: `http://localhost:${env.PORT}/docs` },
      'Swagger docs available at http://localhost:%d/docs',
      env.PORT,
    );
  })
  .catch((err) => {
    httpLogger.error(err, 'Failed to start HTTP server');
    console.error('Failed to start HTTP server:', err);
    process.exit(1);
  });
