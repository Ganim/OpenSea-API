import type { FastifyInstance } from 'fastify';
import { createModuleMiddleware } from '@/http/middlewares/tenant/verify-module';

import { validateSimplesNacionalController } from './v1-validate-simples-nacional.controller';
import { listTaxObligationsController } from './v1-list-tax-obligations.controller';
import { generateTaxObligationsController } from './v1-generate-tax-obligations.controller';
import { markTaxObligationPaidController } from './v1-mark-tax-obligation-paid.controller';

export async function financeComplianceRoutes(app: FastifyInstance) {
  app.addHook('preHandler', createModuleMiddleware('FINANCE'));

  app.register(validateSimplesNacionalController);
  app.register(listTaxObligationsController);
  app.register(generateTaxObligationsController);
  app.register(markTaxObligationPaidController);
}
