import type { FastifyInstance } from 'fastify';

import { exportAccountingController } from './v1-export-accounting.controller';

export async function financeExportRoutes(app: FastifyInstance) {
  app.register(exportAccountingController);
}
