import { FastifyInstance } from 'fastify';
import { createTemplateController } from './v1-create-template.controller';
import { deleteTemplateController } from './v1-delete-template.controller';
import { getTemplateByIdController } from './v1-get-template-by-id.controller';
import { listTemplatesController } from './v1-list-templates.controller';
import { updateTemplateController } from './v1-update-template.controller';

export async function templatesRoutes(app: FastifyInstance) {
  await app.register(createTemplateController);
  await app.register(getTemplateByIdController);
  await app.register(listTemplatesController);
  await app.register(updateTemplateController);
  await app.register(deleteTemplateController);
}
