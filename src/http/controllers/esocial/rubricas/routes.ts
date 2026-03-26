import { rateLimitConfig } from '@/config/rate-limits';
import rateLimit from '@fastify/rate-limit';
import type { FastifyInstance } from 'fastify';
import { v1CreateRubricaController } from './v1-create-rubrica.controller';
import { v1ListRubricasController } from './v1-list-rubricas.controller';
import { v1UpdateRubricaController } from './v1-update-rubrica.controller';
import { v1DeleteRubricaController } from './v1-delete-rubrica.controller';

export async function esocialRubricasRoutes(app: FastifyInstance) {
  // Query routes
  app.register(
    async (queryApp) => {
      queryApp.register(rateLimit, rateLimitConfig.query);
      queryApp.register(v1ListRubricasController);
    },
    { prefix: '' },
  );

  // Mutation routes
  app.register(
    async (mutationApp) => {
      mutationApp.register(rateLimit, rateLimitConfig.mutation);
      mutationApp.register(v1CreateRubricaController);
      mutationApp.register(v1UpdateRubricaController);
      mutationApp.register(v1DeleteRubricaController);
    },
    { prefix: '' },
  );
}
