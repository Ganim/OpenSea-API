import { verifyJwt } from '@/http/middlewares/verify-jwt';
import { verifyUserManager } from '@/http/middlewares/verify-user-manager';
import { FastifyInstance } from 'fastify';
import { createTemplateController } from './v1-create-template.controller';
import { deleteTemplateController } from './v1-delete-template.controller';
import { getTemplateByIdController } from './v1-get-template-by-id.controller';
import { listTemplatesController } from './v1-list-templates.controller';
import { updateTemplateController } from './v1-update-template.controller';

export async function templatesRoutes(app: FastifyInstance) {
  await app.register(createTemplateController, {
    onRequest: [verifyJwt, verifyUserManager],
  });

  await app.register(getTemplateByIdController, {
    onRequest: [verifyJwt],
  });

  await app.register(listTemplatesController, {
    onRequest: [verifyJwt],
  });

  await app.register(updateTemplateController, {
    onRequest: [verifyJwt, verifyUserManager],
  });

  await app.register(deleteTemplateController, {
    onRequest: [verifyJwt, verifyUserManager],
  });
}
