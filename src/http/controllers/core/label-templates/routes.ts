import type { FastifyInstance } from 'fastify';
import { createLabelTemplateController } from './v1-create-label-template.controller';
import { getLabelTemplateByIdController } from './v1-get-label-template-by-id.controller';
import { listLabelTemplatesController } from './v1-list-label-templates.controller';
import { listSystemLabelTemplatesController } from './v1-list-system-label-templates.controller';
import { updateLabelTemplateController } from './v1-update-label-template.controller';
import { deleteLabelTemplateController } from './v1-delete-label-template.controller';
import { duplicateLabelTemplateController } from './v1-duplicate-label-template.controller';
import { generateLabelTemplateThumbnailController } from './v1-generate-label-template-thumbnail.controller';

export async function labelTemplatesRoutes(app: FastifyInstance) {
  await app.register(listSystemLabelTemplatesController);
  await app.register(listLabelTemplatesController);
  await app.register(getLabelTemplateByIdController);
  await app.register(createLabelTemplateController);
  await app.register(updateLabelTemplateController);
  await app.register(deleteLabelTemplateController);
  await app.register(duplicateLabelTemplateController);
  await app.register(generateLabelTemplateThumbnailController);
}
