import type { FastifyInstance } from 'fastify';
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
  await createVolumeController(app);
  await listVolumesController(app);
  await getVolumeByIdController(app);
  await updateVolumeController(app);
  await deleteVolumeController(app);
  await addItemToVolumeController(app);
  await removeItemFromVolumeController(app);
  await closeVolumeController(app);
  await reopenVolumeController(app);
  await deliverVolumeController(app);
  await returnVolumeController(app);
  await getRomaneioController(app);
}
