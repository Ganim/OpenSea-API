import type { FastifyInstance } from 'fastify';

import { createManufacturerController } from './v1-create-manufacturer.controller';
import { deleteManufacturerController } from './v1-delete-manufacturer.controller';
import { getManufacturerByIdController } from './v1-get-manufacturer-by-id.controller';
import { listManufacturersController } from './v1-list-manufacturers.controller';
import { updateManufacturerController } from './v1-update-manufacturer.controller';

export async function manufacturersRoutes(app: FastifyInstance) {
  createManufacturerController(app);
  updateManufacturerController(app);
  deleteManufacturerController(app);
  getManufacturerByIdController(app);
  listManufacturersController(app);
}
