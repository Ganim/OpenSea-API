import { VolumeMapper } from '@/mappers/stock/volume.mapper'
import {
  VolumeNotFoundError,
  VolumeCannotBeClosed,
} from '@/@errors/volumes-errors'
import { VolumeStatus } from '@/entities/stock/value-objects/volume-status'
import type { VolumeRepository } from '@/repositories/stock/volumes-repository'
import type { VolumeDTO } from '@/mappers/stock/volume.mapper'

export interface CloseVolumeUseCaseRequest {
  volumeId: string
  closedBy: string
}

export interface CloseVolumeUseCaseResponse {
  volume: VolumeDTO
}

export class CloseVolumeUseCase {
  constructor(private volumesRepository: VolumeRepository) {}

  async execute(
    request: CloseVolumeUseCaseRequest,
  ): Promise<CloseVolumeUseCaseResponse> {
    const volume = await this.volumesRepository.findById(request.volumeId)
    if (!volume) {
      throw new VolumeNotFoundError(request.volumeId)
    }

    // Validar se pode ser fechado (apenas volumes abertos)
    if (volume.status !== VolumeStatus.OPEN) {
      throw new VolumeCannotBeClosed()
    }

    // Atualizar volume
    volume.status = VolumeStatus.CLOSED
    volume.closedAt = new Date()
    volume.closedBy = request.closedBy
    volume.updatedAt = new Date()

    await this.volumesRepository.update(volume)

    const volumeDTO = VolumeMapper.toDTO(volume)

    return {
      volume: volumeDTO,
    }
  }
}
