import type { FastifyInstance } from 'fastify';
import rateLimit from '@fastify/rate-limit';
import { rateLimitConfig } from '@/config/rate-limits';
import { createModuleMiddleware } from '@/http/middlewares/tenant/verify-module';
import { addItemToVolumeController } from './v1-add-item-to-volume.controller';
import { closeVolumeController } from './v1-close-volume.controller';
import { createVolumeController } from './v1-create-volume.controller';
import { deleteVolumeController } from './v1-delete-volume.controller';
import { deliverVolumeController } from './v1-deliver-volume.controller';
import { getRomaneioController } from './v1-get-romaneio.controller';
import { getVolumeByIdController } from './v1-get-volume-by-id.controller';
import { listVolumesController } from './v1-list-volumes.controller';
import { removeItemFromVolumeController } from './v1-remove-item-from-volume.controller';
import { reopenVolumeController } from './v1-reopen-volume.controller';
import { returnVolumeController } from './v1-return-volume.controller';
import { updateVolumeController } from './v1-update-volume.controller';

export async function volumesRoutes(app: FastifyInstance) {
  app.addHook('onRequest', createModuleMiddleware('STOCK'));

  // Admin routes com rate limit elevado
  app.register(
    async (adminApp) => {
      adminApp.register(rateLimit, rateLimitConfig.admin);
      await deleteVolumeController(adminApp);
    },
    { prefix: '' },
  );

  // Manager routes com rate limit de mutação
  app.register(
    async (managerApp) => {
      managerApp.register(rateLimit, rateLimitConfig.mutation);
      await createVolumeController(managerApp);
      await updateVolumeController(managerApp);
      await addItemToVolumeController(managerApp);
      await removeItemFromVolumeController(managerApp);
      await closeVolumeController(managerApp);
      await reopenVolumeController(managerApp);
      await deliverVolumeController(managerApp);
      await returnVolumeController(managerApp);
    },
    { prefix: '' },
  );

  // Authenticated routes com rate limit de consulta
  app.register(
    async (queryApp) => {
      queryApp.register(rateLimit, rateLimitConfig.query);
      await listVolumesController(queryApp);
      await getVolumeByIdController(queryApp);
      await getRomaneioController(queryApp);
    },
    { prefix: '' },
  );
}
