import type { FastifyInstance } from 'fastify';

import { createLocationController } from './v1-create-location.controller';
import { deleteLocationController } from './v1-delete-location.controller';
import { getLocationByIdController } from './v1-get-location-by-id.controller';
import { listLocationsByLocationIdController } from './v1-list-locations-by-location-id.controller';
import { listLocationsController } from './v1-list-locations.controller';
import { updateLocationController } from './v1-update-location.controller';

export async function locationsRoutes(app: FastifyInstance) {
  createLocationController(app);
  updateLocationController(app);
  deleteLocationController(app);
  getLocationByIdController(app);
  listLocationsController(app);
  listLocationsByLocationIdController(app);
}
