import { VolumeMapper } from '@/mappers/stock/volume.mapper'
import type { VolumeRepository } from '@/repositories/stock/volumes-repository'
import type { VolumeDTO } from '@/mappers/stock/volume.mapper'

export interface ListVolumesUseCaseRequest {
  page?: number
  limit?: number
  status?: string
}

export interface ListVolumesUseCaseResponse {
  volumes: VolumeDTO[]
  total: number
  page: number
  limit: number
  totalPages: number
}

export class ListVolumesUseCase {
  constructor(private volumesRepository: VolumeRepository) {}

  async execute(
    request: ListVolumesUseCaseRequest,
  ): Promise<ListVolumesUseCaseResponse> {
    const page = request.page ?? 1
    const limit = request.limit ?? 10

    const { volumes, total } = await this.volumesRepository.list({
      page,
      limit,
    })

    // Filtrar por status se fornecido
    let filteredVolumes = volumes
    if (request.status) {
      filteredVolumes = volumes.filter(
        (vol) => vol.status === request.status,
      )
    }

    return {
      volumes: filteredVolumes.map((vol) => VolumeMapper.toDTO(vol)),
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    }
  }
}
