import { VolumeMapper } from '@/mappers/stock/volume.mapper'
import { VolumeNotFoundError } from '@/@errors/volumes-errors'
import type { VolumeRepository } from '@/repositories/stock/volumes-repository'
import type { VolumeDTO } from '@/mappers/stock/volume.mapper'

export interface GetVolumeByIdUseCaseRequest {
  volumeId: string
}

export interface GetVolumeByIdUseCaseResponse {
  volume: VolumeDTO & { itemCount: number }
}

export class GetVolumeByIdUseCase {
  constructor(private volumesRepository: VolumeRepository) {}

  async execute(
    request: GetVolumeByIdUseCaseRequest,
  ): Promise<GetVolumeByIdUseCaseResponse> {
    const volume = await this.volumesRepository.findById(request.volumeId)
    if (!volume) {
      throw new VolumeNotFoundError(request.volumeId)
    }

    const itemCount = await this.volumesRepository.countItemsByVolumeId(request.volumeId)

    const volumeDTO = VolumeMapper.toDTO(volume)

    return {
      volume: {
        ...volumeDTO,
        itemCount,
      },
    }
  }
}
