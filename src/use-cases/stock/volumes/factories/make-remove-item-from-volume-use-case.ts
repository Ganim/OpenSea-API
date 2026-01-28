import { PrismaVolumesRepository } from '@/repositories/stock/prisma/prisma-volumes-repository';
import { RemoveItemFromVolumeUseCase } from '../remove-item-from-volume';

export function makeRemoveItemFromVolumeUseCase() {
  const volumesRepository = new PrismaVolumesRepository();
  const removeItemFromVolumeUseCase = new RemoveItemFromVolumeUseCase(
    volumesRepository,
  );
  return removeItemFromVolumeUseCase;
}
