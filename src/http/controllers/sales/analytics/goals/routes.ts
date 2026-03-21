import type { FastifyInstance } from 'fastify';
import { createModuleMiddleware } from '@/http/middlewares/tenant/verify-module';
import { createGoalController } from './v1-create-goal.controller';
import { listGoalsController } from './v1-list-goals.controller';
import { updateGoalController } from './v1-update-goal.controller';
import { deleteGoalController } from './v1-delete-goal.controller';
import { getGoalProgressController } from './v1-get-goal-progress.controller';

export async function analyticsGoalsRoutes(app: FastifyInstance) {
  app.addHook('onRequest', createModuleMiddleware('SALES'));

  await app.register(createGoalController);
  await app.register(listGoalsController);
  await app.register(updateGoalController);
  await app.register(deleteGoalController);
  await app.register(getGoalProgressController);
}
