import { rateLimitConfig } from '@/config/rate-limits';
import rateLimit from '@fastify/rate-limit';
import type { FastifyInstance } from 'fastify';
import { parseAddressController } from './v1-parse-address.controller';
import { suggestAddressController } from './v1-suggest-address.controller';
import { validateAddressController } from './v1-validate-address.controller';

export async function addressRoutes(app: FastifyInstance) {
  // Query routes with query rate limit
  app.register(
    async (queryApp) => {
      queryApp.register(rateLimit, rateLimitConfig.query);
      queryApp.register(parseAddressController);
      queryApp.register(validateAddressController);
    },
    { prefix: '' },
  );

  // Mutation routes with mutation rate limit (suggest is POST but read-only)
  app.register(
    async (mutationApp) => {
      mutationApp.register(rateLimit, rateLimitConfig.query); // Using query rate limit as it's read-only
      mutationApp.register(suggestAddressController);
    },
    { prefix: '' },
  );
}
