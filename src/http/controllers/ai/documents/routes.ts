import type { FastifyInstance } from 'fastify';

import { analyzeDocumentController } from './v1-analyze-document.controller';

export async function aiDocumentsRoutes(app: FastifyInstance) {
  app.register(analyzeDocumentController);
}
