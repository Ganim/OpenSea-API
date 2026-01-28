import { PrismaVolumesRepository } from '@/repositories/stock/prisma/prisma-volumes-repository';
import { DeliverVolumeUseCase } from '../deliver-volume';

export function makeDeliverVolumeUseCase() {
  const volumesRepository = new PrismaVolumesRepository();
  const deliverVolumeUseCase = new DeliverVolumeUseCase(volumesRepository);
  return deliverVolumeUseCase;
}
