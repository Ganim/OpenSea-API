import type { FastifyInstance } from 'fastify';

import { createLabelController } from './v1-create-label.controller';
import { deleteLabelController } from './v1-delete-label.controller';
import { listLabelsController } from './v1-list-labels.controller';
import { updateLabelController } from './v1-update-label.controller';

export async function taskLabelsRoutes(app: FastifyInstance) {
  app.register(createLabelController);
  app.register(updateLabelController);
  app.register(deleteLabelController);
  app.register(listLabelsController);
}
