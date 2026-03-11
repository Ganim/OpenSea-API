import type { FastifyInstance } from 'fastify';
import rateLimit from '@fastify/rate-limit';
import { rateLimitConfig } from '@/config/rate-limits';
import { createModuleMiddleware } from '@/http/middlewares/tenant/verify-module';
import { getBinByIdController } from './v1-get-bin-by-id.controller';
import { getBinByAddressController } from './v1-get-bin-by-address.controller';
import { getBinDetailController } from './v1-get-bin-detail.controller';
import { listBinsController } from './v1-list-bins.controller';
import { searchBinsController } from './v1-search-bins.controller';
import { listAvailableBinsController } from './v1-list-available-bins.controller';
import { getBinOccupancyMapController } from './v1-get-bin-occupancy-map.controller';
import { updateBinController } from './v1-update-bin.controller';
import { blockBinController } from './v1-block-bin.controller';
import { unblockBinController } from './v1-unblock-bin.controller';

export async function binsRoutes(app: FastifyInstance) {
  app.addHook('onRequest', createModuleMiddleware('STOCK'));

  // Manager routes com rate limit de mutação
  app.register(
    async (managerApp) => {
      managerApp.register(rateLimit, rateLimitConfig.mutation);
      await updateBinController(managerApp);
      await blockBinController(managerApp);
      await unblockBinController(managerApp);
    },
    { prefix: '' },
  );

  // Authenticated routes com rate limit de consulta
  app.register(
    async (queryApp) => {
      queryApp.register(rateLimit, rateLimitConfig.query);
      await getBinDetailController(queryApp);
      await getBinByIdController(queryApp);
      await getBinByAddressController(queryApp);
      await listBinsController(queryApp);
      await searchBinsController(queryApp);
      await listAvailableBinsController(queryApp);
      await getBinOccupancyMapController(queryApp);
    },
    { prefix: '' },
  );
}
