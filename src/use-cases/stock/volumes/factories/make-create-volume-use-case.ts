import { PrismaVolumesRepository } from '@/repositories/stock/prisma/prisma-volumes-repository';
import { CreateVolumeUseCase } from '../create-volume';

export function makeCreateVolumeUseCase() {
  const volumesRepository = new PrismaVolumesRepository();
  const createVolumeUseCase = new CreateVolumeUseCase(volumesRepository);
  return createVolumeUseCase;
}
