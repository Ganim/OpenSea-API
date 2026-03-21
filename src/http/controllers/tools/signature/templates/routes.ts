import type { FastifyInstance } from 'fastify';
import { listSignatureTemplatesController } from './v1-list-templates.controller';
import { createSignatureTemplateController } from './v1-create-template.controller';

export async function signatureTemplatesRoutes(app: FastifyInstance) {
  await app.register(listSignatureTemplatesController);
  await app.register(createSignatureTemplateController);
}
