import { PrismaVolumesRepository } from '@/repositories/stock/prisma/prisma-volumes-repository';
import { AddItemToVolumeUseCase } from '../add-item-to-volume';

export function makeAddItemToVolumeUseCase() {
  const volumesRepository = new PrismaVolumesRepository();
  const addItemToVolumeUseCase = new AddItemToVolumeUseCase(volumesRepository);
  return addItemToVolumeUseCase;
}
