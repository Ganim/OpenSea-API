import type { FastifyInstance } from 'fastify';

import { listBoardActivityController } from './v1-list-board-activity.controller';
import { listCardActivityController } from './v1-list-card-activity.controller';

export async function taskActivityRoutes(app: FastifyInstance) {
  app.register(listCardActivityController);
  app.register(listBoardActivityController);
}
