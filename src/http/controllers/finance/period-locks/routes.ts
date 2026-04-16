import { createModuleMiddleware } from '@/http/middlewares/tenant/verify-module';
import type { FastifyInstance } from 'fastify';
import { createPeriodLockController } from './v1-create-period-lock.controller';
import { deletePeriodLockController } from './v1-delete-period-lock.controller';
import { listPeriodLocksController } from './v1-list-period-locks.controller';

export async function financePeriodLockRoutes(app: FastifyInstance) {
  app.addHook('preHandler', createModuleMiddleware('FINANCE'));

  app.register(listPeriodLocksController);
  app.register(createPeriodLockController);
  app.register(deletePeriodLockController);
}
