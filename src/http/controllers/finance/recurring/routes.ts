import type { FastifyInstance } from 'fastify';
import { createModuleMiddleware } from '@/http/middlewares/tenant/verify-module';
import { rateLimitConfig } from '@/config/rate-limits';
import rateLimit from '@fastify/rate-limit';

import { createRecurringConfigController } from './v1-create-recurring-config.controller';
import { listRecurringConfigsController } from './v1-list-recurring-configs.controller';
import { getRecurringConfigController } from './v1-get-recurring-config.controller';
import { updateRecurringConfigController } from './v1-update-recurring-config.controller';
import { pauseRecurringController } from './v1-pause-recurring.controller';
import { resumeRecurringController } from './v1-resume-recurring.controller';
import { cancelRecurringController } from './v1-cancel-recurring.controller';
import { previewRecurringDatesController } from './v1-preview-recurring-dates.controller';

export async function financeRecurringRoutes(app: FastifyInstance) {
  app.addHook('preHandler', createModuleMiddleware('FINANCE'));

  // Query routes
  app.register(
    async (queryApp) => {
      queryApp.register(rateLimit, rateLimitConfig.query);
      queryApp.register(listRecurringConfigsController);
      queryApp.register(getRecurringConfigController);
      queryApp.register(previewRecurringDatesController);
    },
    { prefix: '' },
  );

  // Mutation routes
  app.register(
    async (mutationApp) => {
      mutationApp.register(rateLimit, rateLimitConfig.financeMutation);
      mutationApp.register(createRecurringConfigController);
      mutationApp.register(updateRecurringConfigController);
      mutationApp.register(pauseRecurringController);
      mutationApp.register(resumeRecurringController);
      mutationApp.register(cancelRecurringController);
    },
    { prefix: '' },
  );
}
