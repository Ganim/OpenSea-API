import { VolumeNotFoundError } from '@/@errors/volumes-errors';
import { VolumeStatus } from '@/entities/stock/value-objects/volume-status';
import type { VolumeDTO } from '@/mappers/stock/volume.mapper';
import { VolumeMapper } from '@/mappers/stock/volume.mapper';
import type { VolumeRepository } from '@/repositories/stock/volumes-repository';

export interface ReopenVolumeUseCaseRequest {
  tenantId: string;
  volumeId: string;
}

export interface ReopenVolumeUseCaseResponse {
  volume: VolumeDTO;
}

export class ReopenVolumeUseCase {
  constructor(private volumesRepository: VolumeRepository) {}

  async execute(
    request: ReopenVolumeUseCaseRequest,
  ): Promise<ReopenVolumeUseCaseResponse> {
    const volume = await this.volumesRepository.findById(
      request.volumeId,
      request.tenantId,
    );
    if (!volume) {
      throw new VolumeNotFoundError(request.volumeId);
    }

    // Reabrir volume (mudar status para OPEN)
    volume.status = VolumeStatus.OPEN;
    volume.closedAt = undefined;
    volume.closedBy = undefined;
    volume.updatedAt = new Date();

    await this.volumesRepository.update(volume);

    const volumeDTO = VolumeMapper.toDTO(volume);

    return {
      volume: volumeDTO,
    };
  }
}
