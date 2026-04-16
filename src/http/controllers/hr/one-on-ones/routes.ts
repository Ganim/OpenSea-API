import type { FastifyInstance } from 'fastify';
import { createModuleMiddleware } from '@/http/middlewares/tenant/verify-module';
import { rateLimitConfig } from '@/config/rate-limits';
import rateLimit from '@fastify/rate-limit';
import { v1AddActionItemController } from './v1-add-action-item.controller';
import { v1AddTalkingPointController } from './v1-add-talking-point.controller';
import { v1DeleteActionItemController } from './v1-delete-action-item.controller';
import { v1DeleteOneOnOneController } from './v1-delete-one-on-one.controller';
import { v1DeleteTalkingPointController } from './v1-delete-talking-point.controller';
import { v1GetOneOnOneController } from './v1-get-one-on-one.controller';
import { v1ListOneOnOnesController } from './v1-list-one-on-ones.controller';
import { v1ScheduleOneOnOneController } from './v1-schedule-one-on-one.controller';
import { v1UpdateActionItemController } from './v1-update-action-item.controller';
import { v1UpdateOneOnOneController } from './v1-update-one-on-one.controller';
import { v1UpdateTalkingPointController } from './v1-update-talking-point.controller';

export async function oneOnOnesRoutes(app: FastifyInstance) {
  app.addHook('preHandler', createModuleMiddleware('HR'));

  app.register(
    async (mutationApp) => {
      mutationApp.register(rateLimit, rateLimitConfig.mutation);
      mutationApp.register(v1ScheduleOneOnOneController);
      mutationApp.register(v1UpdateOneOnOneController);
      mutationApp.register(v1DeleteOneOnOneController);
      mutationApp.register(v1AddTalkingPointController);
      mutationApp.register(v1UpdateTalkingPointController);
      mutationApp.register(v1DeleteTalkingPointController);
      mutationApp.register(v1AddActionItemController);
      mutationApp.register(v1UpdateActionItemController);
      mutationApp.register(v1DeleteActionItemController);
    },
    { prefix: '' },
  );

  app.register(
    async (queryApp) => {
      queryApp.register(rateLimit, rateLimitConfig.query);
      queryApp.register(v1ListOneOnOnesController);
      queryApp.register(v1GetOneOnOneController);
    },
    { prefix: '' },
  );
}
