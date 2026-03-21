import type { FastifyInstance } from 'fastify';

import { listActionLogsController } from './v1-list-action-logs.controller';

export async function aiActionLogsRoutes(app: FastifyInstance) {
  app.register(listActionLogsController);
}
