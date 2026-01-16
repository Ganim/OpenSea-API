import { PrismaVolumesRepository } from '@/repositories/stock/prisma/prisma-volumes-repository'
import { ListVolumesUseCase } from '../list-volumes'

export function makeListVolumesUseCase() {
  const volumesRepository = new PrismaVolumesRepository()
  const listVolumesUseCase = new ListVolumesUseCase(volumesRepository)
  return listVolumesUseCase
}
