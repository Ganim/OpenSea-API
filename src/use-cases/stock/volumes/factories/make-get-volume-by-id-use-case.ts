import { PrismaVolumesRepository } from '@/repositories/stock/prisma/prisma-volumes-repository'
import { GetVolumeByIdUseCase } from '../get-volume-by-id'

export function makeGetVolumeByIdUseCase() {
  const volumesRepository = new PrismaVolumesRepository()
  const getVolumeByIdUseCase = new GetVolumeByIdUseCase(volumesRepository)
  return getVolumeByIdUseCase
}
