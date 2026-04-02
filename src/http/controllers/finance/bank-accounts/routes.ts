import type { FastifyInstance } from 'fastify';
import { createModuleMiddleware } from '@/http/middlewares/tenant/verify-module';
import { rateLimitConfig } from '@/config/rate-limits';
import rateLimit from '@fastify/rate-limit';

import { createBankAccountController } from './v1-create-bank-account.controller';
import { deleteBankAccountController } from './v1-delete-bank-account.controller';
import { getBankAccountByIdController } from './v1-get-bank-account-by-id.controller';
import { getBankAccountBalanceController } from './v1-get-bank-account-balance.controller';
import { listBankAccountsController } from './v1-list-bank-accounts.controller';
import { updateBankAccountController } from './v1-update-bank-account.controller';
import { updateBankAccountApiConfigController } from './v1-update-bank-account-api-config.controller';
import { getBankAccountHealthController } from './v1-get-bank-account-health.controller';
import { convertPfxCertificateController } from './v1-convert-pfx-certificate.controller';

export async function bankAccountsRoutes(app: FastifyInstance) {
  app.addHook('preHandler', createModuleMiddleware('FINANCE'));

  // Query routes
  app.register(
    async (queryApp) => {
      queryApp.register(rateLimit, rateLimitConfig.query);
      queryApp.register(getBankAccountByIdController);
      queryApp.register(getBankAccountBalanceController);
      queryApp.register(getBankAccountHealthController);
      queryApp.register(listBankAccountsController);
    },
    { prefix: '' },
  );

  // Mutation routes
  app.register(
    async (mutationApp) => {
      mutationApp.register(rateLimit, rateLimitConfig.financeMutation);
      mutationApp.register(createBankAccountController);
      mutationApp.register(updateBankAccountController);
      mutationApp.register(updateBankAccountApiConfigController);
      mutationApp.register(deleteBankAccountController);
      mutationApp.register(convertPfxCertificateController);
    },
    { prefix: '' },
  );
}
