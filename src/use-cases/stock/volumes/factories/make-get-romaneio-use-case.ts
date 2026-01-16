import { PrismaVolumesRepository } from '@/repositories/stock/prisma/prisma-volumes-repository'
import { GetRomaneioUseCase } from '../get-romaneio'

export function makeGetRomaneioUseCase() {
  const volumesRepository = new PrismaVolumesRepository()
  const getRomaneioUseCase = new GetRomaneioUseCase(volumesRepository)
  return getRomaneioUseCase
}
