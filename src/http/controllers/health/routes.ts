import { rateLimitConfig } from '@/config/rate-limits';
import rateLimit from '@fastify/rate-limit';
import { FastifyInstance } from 'fastify';
import { healthCheckController } from './health-check.controller';

export async function healthRoutes(app: FastifyInstance) {
  // Health check com rate limit público
  app.register(
    async (healthApp) => {
      healthApp.register(rateLimit, rateLimitConfig.public);
      healthApp.register(healthCheckController);
    },
    { prefix: '' },
  );
}
