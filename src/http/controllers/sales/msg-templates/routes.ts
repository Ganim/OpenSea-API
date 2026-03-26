import type { FastifyInstance } from 'fastify';
import { createModuleMiddleware } from '@/http/middlewares/tenant/verify-module';
import { listMsgTemplatesController } from './v1-list-msg-templates.controller';
import { createMsgTemplateController } from './v1-create-msg-template.controller';
import { updateMsgTemplateController } from './v1-update-msg-template.controller';
import { deleteMsgTemplateController } from './v1-delete-msg-template.controller';
import { getMsgTemplateByIdController } from './v1-get-msg-template-by-id.controller';
import { previewMsgTemplateController } from './v1-preview-msg-template.controller';
import { duplicateMsgTemplateController } from './v1-duplicate-msg-template.controller';

export async function msgTemplatesRoutes(app: FastifyInstance) {
  app.addHook('onRequest', createModuleMiddleware('SALES'));

  await app.register(listMsgTemplatesController);
  await app.register(getMsgTemplateByIdController);
  await app.register(createMsgTemplateController);
  await app.register(updateMsgTemplateController);
  await app.register(deleteMsgTemplateController);
  await app.register(previewMsgTemplateController);
  await app.register(duplicateMsgTemplateController);
}
