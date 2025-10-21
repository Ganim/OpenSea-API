import { verifyJwt } from '@/http/middlewares/verify-jwt';
import { verifyUserManager } from '@/http/middlewares/verify-user-manager';
import { FastifyInstance } from 'fastify';
import { v1CreateTemplateController } from './v1-create-template.controller';
import { v1DeleteTemplateController } from './v1-delete-template.controller';
import { v1GetTemplateByIdController } from './v1-get-template-by-id.controller';
import { v1ListTemplatesController } from './v1-list-templates.controller';
import { v1UpdateTemplateController } from './v1-update-template.controller';

export async function templatesRoutes(app: FastifyInstance) {
  // Create template (Manager only)
  app.post(
    '/v1/templates',
    {
      onRequest: [verifyJwt, verifyUserManager],
      schema: v1CreateTemplateController.schema,
    },
    v1CreateTemplateController,
  );

  // Get template by ID (Authenticated) - MUST be before /v1/templates list route
  app.get(
    '/v1/templates/:id',
    {
      onRequest: [verifyJwt],
      schema: v1GetTemplateByIdController.schema,
    },
    v1GetTemplateByIdController,
  );

  // List templates (Authenticated)
  app.get(
    '/v1/templates',
    {
      onRequest: [verifyJwt],
      schema: v1ListTemplatesController.schema,
    },
    v1ListTemplatesController,
  );

  // Update template (Manager only)
  app.put(
    '/v1/templates/:id',
    {
      onRequest: [verifyJwt, verifyUserManager],
      schema: v1UpdateTemplateController.schema,
    },
    v1UpdateTemplateController,
  );

  // Delete template (Manager only)
  app.delete(
    '/v1/templates/:id',
    {
      onRequest: [verifyJwt, verifyUserManager],
      schema: v1DeleteTemplateController.schema,
    },
    v1DeleteTemplateController,
  );
}
