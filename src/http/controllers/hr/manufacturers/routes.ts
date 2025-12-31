import type { FastifyInstance } from 'fastify';
import { v1CreateManufacturerController } from './v1-create-manufacturer.controller';
import { v1GetManufacturerByIdController } from './v1-get-manufacturer-by-id.controller';
import { v1ListManufacturersController } from './v1-list-manufacturers.controller';
import { v1UpdateManufacturerController } from './v1-update-manufacturer.controller';
import { v1DeleteManufacturerController } from './v1-delete-manufacturer.controller';

export async function manufacturersRoutes(app: FastifyInstance) {
  await v1CreateManufacturerController(app);
  await v1GetManufacturerByIdController(app);
  await v1ListManufacturersController(app);
  await v1UpdateManufacturerController(app);
  await v1DeleteManufacturerController(app);
}
