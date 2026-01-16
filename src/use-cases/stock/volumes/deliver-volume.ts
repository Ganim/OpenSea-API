import { VolumeMapper } from '@/mappers/stock/volume.mapper'
import { VolumeNotFoundError } from '@/@errors/volumes-errors'
import { VolumeStatus } from '@/entities/stock/value-objects/volume-status'
import type { VolumeRepository } from '@/repositories/stock/volumes-repository'
import type { VolumeDTO } from '@/mappers/stock/volume.mapper'

export interface DeliverVolumeUseCaseRequest {
  volumeId: string
  deliveredBy: string
}

export interface DeliverVolumeUseCaseResponse {
  volume: VolumeDTO
}

export class DeliverVolumeUseCase {
  constructor(private volumesRepository: VolumeRepository) {}

  async execute(
    request: DeliverVolumeUseCaseRequest,
  ): Promise<DeliverVolumeUseCaseResponse> {
    const volume = await this.volumesRepository.findById(request.volumeId)
    if (!volume) {
      throw new VolumeNotFoundError(request.volumeId)
    }

    // Marcar como entregue
    volume.status = VolumeStatus.DELIVERED
    volume.deliveredAt = new Date()
    volume.deliveredBy = request.deliveredBy
    volume.updatedAt = new Date()

    await this.volumesRepository.update(volume)

    const volumeDTO = VolumeMapper.toDTO(volume)

    return {
      volume: volumeDTO,
    }
  }
}
