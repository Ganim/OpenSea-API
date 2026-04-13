import type { FastifyInstance } from 'fastify';
import rateLimit from '@fastify/rate-limit';
import { rateLimitConfig } from '@/config/rate-limits';
import { createModuleMiddleware } from '@/http/middlewares/tenant/verify-module';
import { listMaterialReservationsController } from './v1-list-material-reservations.controller';
import { createMaterialReservationController } from './v1-create-material-reservation.controller';
import { cancelMaterialReservationController } from './v1-cancel-material-reservation.controller';

export async function materialReservationsRoutes(app: FastifyInstance) {
  app.addHook('onRequest', createModuleMiddleware('PRODUCTION'));

  // Query routes com rate limit de consulta
  app.register(
    async (queryApp) => {
      queryApp.register(rateLimit, rateLimitConfig.query);
      queryApp.register(listMaterialReservationsController);
    },
    { prefix: '' },
  );

  // Mutation routes com rate limit de mutação
  app.register(
    async (mutationApp) => {
      mutationApp.register(rateLimit, rateLimitConfig.mutation);
      mutationApp.register(createMaterialReservationController);
      mutationApp.register(cancelMaterialReservationController);
    },
    { prefix: '' },
  );
}
