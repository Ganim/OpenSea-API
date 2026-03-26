import type { FastifyInstance } from 'fastify';
import { createModuleMiddleware } from '@/http/middlewares/tenant/verify-module';
import { createFormController } from './v1-create-form.controller';
import { deleteFormController } from './v1-delete-form.controller';
import { duplicateFormController } from './v1-duplicate-form.controller';
import { getFormByIdController } from './v1-get-form-by-id.controller';
import { listFormsController } from './v1-list-forms.controller';
import { listSubmissionsController } from './v1-list-submissions.controller';
import { publishFormController } from './v1-publish-form.controller';
import { submitFormController } from './v1-submit-form.controller';
import { unpublishFormController } from './v1-unpublish-form.controller';
import { updateFormController } from './v1-update-form.controller';

export async function formsRoutes(app: FastifyInstance) {
  app.addHook('onRequest', createModuleMiddleware('SALES'));

  await app.register(listFormsController);
  await app.register(getFormByIdController);
  await app.register(createFormController);
  await app.register(updateFormController);
  await app.register(deleteFormController);
  await app.register(publishFormController);
  await app.register(unpublishFormController);
  await app.register(duplicateFormController);
  await app.register(listSubmissionsController);
  await app.register(submitFormController);
}
