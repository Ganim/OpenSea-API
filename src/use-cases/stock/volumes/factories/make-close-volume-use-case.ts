import { PrismaVolumesRepository } from '@/repositories/stock/prisma/prisma-volumes-repository';
import { CloseVolumeUseCase } from '../close-volume';

export function makeCloseVolumeUseCase() {
  const volumesRepository = new PrismaVolumesRepository();
  const closeVolumeUseCase = new CloseVolumeUseCase(volumesRepository);
  return closeVolumeUseCase;
}
