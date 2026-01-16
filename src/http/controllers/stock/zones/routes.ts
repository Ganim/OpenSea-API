import type { FastifyInstance } from 'fastify';
import { createZoneController } from './v1-create-zone.controller';
import { updateZoneController } from './v1-update-zone.controller';
import { deleteZoneController } from './v1-delete-zone.controller';
import { getZoneByIdController } from './v1-get-zone-by-id.controller';
import { listZonesController } from './v1-list-zones.controller';
import { configureZoneStructureController } from './v1-configure-zone-structure.controller';
import { previewZoneStructureController } from './v1-preview-zone-structure.controller';
import { updateZoneLayoutController } from './v1-update-zone-layout.controller';
import { resetZoneLayoutController } from './v1-reset-zone-layout.controller';

export async function zonesRoutes(app: FastifyInstance) {
  await createZoneController(app);
  await updateZoneController(app);
  await deleteZoneController(app);
  await getZoneByIdController(app);
  await listZonesController(app);
  await configureZoneStructureController(app);
  await previewZoneStructureController(app);
  await updateZoneLayoutController(app);
  await resetZoneLayoutController(app);
}
