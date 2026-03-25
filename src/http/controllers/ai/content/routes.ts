import type { FastifyInstance } from 'fastify';

import { generateContentController } from './v1-generate-content.controller';

export async function aiContentRoutes(app: FastifyInstance) {
  app.register(generateContentController);
}
