import {
  VolumeCannotBeClosed,
  VolumeNotFoundError,
} from '@/@errors/volumes-errors';
import { VolumeStatus } from '@/entities/stock/value-objects/volume-status';
import type { VolumeDTO } from '@/mappers/stock/volume/volume-to-dto';
import { volumeToDTO } from '@/mappers/stock/volume/volume-to-dto';
import type { VolumeRepository } from '@/repositories/stock/volumes-repository';

export interface CloseVolumeUseCaseRequest {
  tenantId: string;
  volumeId: string;
  closedBy: string;
}

export interface CloseVolumeUseCaseResponse {
  volume: VolumeDTO;
}

export class CloseVolumeUseCase {
  constructor(private volumesRepository: VolumeRepository) {}

  async execute(
    request: CloseVolumeUseCaseRequest,
  ): Promise<CloseVolumeUseCaseResponse> {
    const volume = await this.volumesRepository.findById(
      request.volumeId,
      request.tenantId,
    );
    if (!volume) {
      throw new VolumeNotFoundError(request.volumeId);
    }

    // Validar se pode ser fechado (apenas volumes abertos)
    if (volume.status !== VolumeStatus.OPEN) {
      throw new VolumeCannotBeClosed();
    }

    // Atualizar volume
    volume.status = VolumeStatus.CLOSED;
    volume.closedAt = new Date();
    volume.closedBy = request.closedBy;
    volume.updatedAt = new Date();

    await this.volumesRepository.update(volume);

    const volumeDTO = volumeToDTO(volume);

    return {
      volume: volumeDTO,
    };
  }
}
