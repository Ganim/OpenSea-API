import type { FastifyInstance } from 'fastify';
import { createModuleMiddleware } from '@/http/middlewares/tenant/verify-module';
import { rateLimitConfig } from '@/config/rate-limits';
import rateLimit from '@fastify/rate-limit';

import { validateSimplesNacionalController } from './v1-validate-simples-nacional.controller';
import { listTaxObligationsController } from './v1-list-tax-obligations.controller';
import { generateTaxObligationsController } from './v1-generate-tax-obligations.controller';
import { markTaxObligationPaidController } from './v1-mark-tax-obligation-paid.controller';

export async function financeComplianceRoutes(app: FastifyInstance) {
  app.addHook('preHandler', createModuleMiddleware('FINANCE'));

  // Query routes
  app.register(
    async (queryApp) => {
      queryApp.register(rateLimit, rateLimitConfig.query);
      queryApp.register(validateSimplesNacionalController);
      queryApp.register(listTaxObligationsController);
    },
    { prefix: '' },
  );

  // Mutation routes
  app.register(
    async (mutationApp) => {
      mutationApp.register(rateLimit, rateLimitConfig.financeMutation);
      mutationApp.register(generateTaxObligationsController);
      mutationApp.register(markTaxObligationPaidController);
    },
    { prefix: '' },
  );
}
