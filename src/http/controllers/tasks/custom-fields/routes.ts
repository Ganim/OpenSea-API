import type { FastifyInstance } from 'fastify';
import { createModuleMiddleware } from '@/http/middlewares/tenant/verify-module';

import { createCustomFieldController } from './v1-create-custom-field.controller';
import { deleteCustomFieldController } from './v1-delete-custom-field.controller';
import { listCustomFieldsController } from './v1-list-custom-fields.controller';
import { setCardCustomFieldValuesController } from './v1-set-card-custom-field-values.controller';
import { updateCustomFieldController } from './v1-update-custom-field.controller';

export async function taskCustomFieldsRoutes(app: FastifyInstance) {
app.addHook('onRequest', createModuleMiddleware('TASKS'));

  app.register(createCustomFieldController);
  app.register(updateCustomFieldController);
  app.register(deleteCustomFieldController);
  app.register(listCustomFieldsController);
  app.register(setCardCustomFieldValuesController);
}
