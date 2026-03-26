import type { FastifyInstance } from 'fastify';
import { createModuleMiddleware } from '@/http/middlewares/tenant/verify-module';

import { inviteAccountantController } from './v1-invite-accountant.controller';
import { revokeAccountantController } from './v1-revoke-accountant.controller';
import { listAccountantAccessesController } from './v1-list-accountant-accesses.controller';

export async function financeAccountantRoutes(app: FastifyInstance) {
  app.addHook('preHandler', createModuleMiddleware('FINANCE'));

  app.register(inviteAccountantController);
  app.register(revokeAccountantController);
  app.register(listAccountantAccessesController);
}
