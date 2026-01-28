import { PrismaVolumesRepository } from '@/repositories/stock/prisma/prisma-volumes-repository';
import { ReopenVolumeUseCase } from '../reopen-volume';

export function makeReopenVolumeUseCase() {
  const volumesRepository = new PrismaVolumesRepository();
  const reopenVolumeUseCase = new ReopenVolumeUseCase(volumesRepository);
  return reopenVolumeUseCase;
}
