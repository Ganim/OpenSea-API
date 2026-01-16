import type { FastifyInstance } from 'fastify';
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
  await getBinDetailController(app);
  await getBinByIdController(app);
  await getBinByAddressController(app);
  await listBinsController(app);
  await searchBinsController(app);
  await listAvailableBinsController(app);
  await getBinOccupancyMapController(app);
  await updateBinController(app);
  await blockBinController(app);
  await unblockBinController(app);
}
