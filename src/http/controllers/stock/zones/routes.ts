import type { FastifyInstance } from 'fastify';
import rateLimit from '@fastify/rate-limit';
import { rateLimitConfig } from '@/config/rate-limits';
import { createModuleMiddleware } from '@/http/middlewares/tenant/verify-module';
import { createZoneController } from './v1-create-zone.controller';
import { updateZoneController } from './v1-update-zone.controller';
import { deleteZoneController } from './v1-delete-zone.controller';
import { getZoneByIdController } from './v1-get-zone-by-id.controller';
import { listZonesController } from './v1-list-zones.controller';
import { configureZoneStructureController } from './v1-configure-zone-structure.controller';
import { previewZoneStructureController } from './v1-preview-zone-structure.controller';
import { previewZoneReconfigurationController } from './v1-preview-zone-reconfiguration.controller';
import { getZoneItemStatsController } from './v1-get-zone-item-stats.controller';
import { updateZoneLayoutController } from './v1-update-zone-layout.controller';
import { resetZoneLayoutController } from './v1-reset-zone-layout.controller';

export async function zonesRoutes(app: FastifyInstance) {
  app.addHook('onRequest', createModuleMiddleware('STOCK'));

  // Admin routes com rate limit elevado
  app.register(
    async (adminApp) => {
      adminApp.register(rateLimit, rateLimitConfig.admin);
      await deleteZoneController(adminApp);
    },
    { prefix: '' },
  );

  // Manager routes com rate limit de mutação
  app.register(
    async (managerApp) => {
      managerApp.register(rateLimit, rateLimitConfig.mutation);
      await createZoneController(managerApp);
      await updateZoneController(managerApp);
      await configureZoneStructureController(managerApp);
      await updateZoneLayoutController(managerApp);
      await resetZoneLayoutController(managerApp);
    },
    { prefix: '' },
  );

  // Authenticated routes com rate limit de consulta
  app.register(
    async (queryApp) => {
      queryApp.register(rateLimit, rateLimitConfig.query);
      await getZoneByIdController(queryApp);
      await listZonesController(queryApp);
      await previewZoneStructureController(queryApp);
      await previewZoneReconfigurationController(queryApp);
      await getZoneItemStatsController(queryApp);
    },
    { prefix: '' },
  );
}
