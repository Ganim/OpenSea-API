import type { FastifyInstance } from 'fastify';

import { createBankAccountController } from './v1-create-bank-account.controller';
import { deleteBankAccountController } from './v1-delete-bank-account.controller';
import { getBankAccountByIdController } from './v1-get-bank-account-by-id.controller';
import { listBankAccountsController } from './v1-list-bank-accounts.controller';
import { updateBankAccountController } from './v1-update-bank-account.controller';

export async function bankAccountsRoutes(app: FastifyInstance) {
  app.register(getBankAccountByIdController);
  app.register(listBankAccountsController);
  app.register(createBankAccountController);
  app.register(updateBankAccountController);
  app.register(deleteBankAccountController);
}
