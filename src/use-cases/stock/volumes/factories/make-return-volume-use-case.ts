import { PrismaVolumesRepository } from '@/repositories/stock/prisma/prisma-volumes-repository';
import { ReturnVolumeUseCase } from '../return-volume';

export function makeReturnVolumeUseCase() {
  const volumesRepository = new PrismaVolumesRepository();
  const returnVolumeUseCase = new ReturnVolumeUseCase(volumesRepository);
  return returnVolumeUseCase;
}
