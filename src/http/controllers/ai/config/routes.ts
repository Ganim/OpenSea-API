import type { FastifyInstance } from 'fastify';

import { getAiConfigController } from './v1-get-ai-config.controller';
import { updateAiConfigController } from './v1-update-ai-config.controller';

export async function aiConfigRoutes(app: FastifyInstance) {
  app.register(getAiConfigController);
  app.register(updateAiConfigController);
}
