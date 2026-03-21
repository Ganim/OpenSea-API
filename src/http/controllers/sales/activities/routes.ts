import type { FastifyInstance } from 'fastify';
import { createModuleMiddleware } from '@/http/middlewares/tenant/verify-module';
import { createActivityController } from './v1-create-activity.controller';
import { deleteActivityController } from './v1-delete-activity.controller';
import { listActivitiesController } from './v1-list-activities.controller';
import { updateActivityController } from './v1-update-activity.controller';

export async function activitiesRoutes(app: FastifyInstance) {
  app.addHook('onRequest', createModuleMiddleware('SALES'));

  await app.register(listActivitiesController);
  await app.register(createActivityController);
  await app.register(updateActivityController);
  await app.register(deleteActivityController);
}
