import { rateLimitConfig } from '@/config/rate-limits';
import rateLimit from '@fastify/rate-limit';
import type { FastifyInstance } from 'fastify';
import { createCompanyAddressController } from './v1-create-company-address.controller';
import { deleteCompanyAddressController } from './v1-delete-company-address.controller';
import { listCompanyAddressesController } from './v1-list-company-addresses.controller';
import { updateCompanyAddressController } from './v1-update-company-address.controller';

export async function companyAddressesRoutes(app: FastifyInstance) {
  // Mutation routes with manager guard at controller level
  app.register(
    async (mutationApp) => {
      mutationApp.register(rateLimit, rateLimitConfig.mutation);
      mutationApp.register(createCompanyAddressController);
      mutationApp.register(updateCompanyAddressController);
      mutationApp.register(deleteCompanyAddressController);
    },
    { prefix: '' },
  );

  // Query routes
  app.register(
    async (queryApp) => {
      queryApp.register(rateLimit, rateLimitConfig.query);
      queryApp.register(listCompanyAddressesController);
    },
    { prefix: '' },
  );
}
