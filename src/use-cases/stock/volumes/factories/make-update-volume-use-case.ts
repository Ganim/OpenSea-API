import { PrismaVolumesRepository } from '@/repositories/stock/prisma/prisma-volumes-repository'
import { UpdateVolumeUseCase } from '../update-volume'

export function makeUpdateVolumeUseCase() {
  const volumesRepository = new PrismaVolumesRepository()
  const updateVolumeUseCase = new UpdateVolumeUseCase(volumesRepository)
  return updateVolumeUseCase
}
