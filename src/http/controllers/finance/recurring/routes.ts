import type { FastifyInstance } from 'fastify';
import { createModuleMiddleware } from '@/http/middlewares/tenant/verify-module';

import { createRecurringConfigController } from './v1-create-recurring-config.controller';
import { listRecurringConfigsController } from './v1-list-recurring-configs.controller';
import { getRecurringConfigController } from './v1-get-recurring-config.controller';
import { updateRecurringConfigController } from './v1-update-recurring-config.controller';
import { pauseRecurringController } from './v1-pause-recurring.controller';
import { resumeRecurringController } from './v1-resume-recurring.controller';
import { cancelRecurringController } from './v1-cancel-recurring.controller';

export async function financeRecurringRoutes(app: FastifyInstance) {
  app.addHook('onRequest', createModuleMiddleware('FINANCE'));

  app.register(createRecurringConfigController);
  app.register(listRecurringConfigsController);
  app.register(getRecurringConfigController);
  app.register(updateRecurringConfigController);
  app.register(pauseRecurringController);
  app.register(resumeRecurringController);
  app.register(cancelRecurringController);
}
