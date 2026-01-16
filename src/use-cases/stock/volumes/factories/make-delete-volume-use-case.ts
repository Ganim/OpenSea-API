import { PrismaVolumesRepository } from '@/repositories/stock/prisma/prisma-volumes-repository'
import { DeleteVolumeUseCase } from '../delete-volume'

export function makeDeleteVolumeUseCase() {
  const volumesRepository = new PrismaVolumesRepository()
  const deleteVolumeUseCase = new DeleteVolumeUseCase(volumesRepository)
  return deleteVolumeUseCase
}
