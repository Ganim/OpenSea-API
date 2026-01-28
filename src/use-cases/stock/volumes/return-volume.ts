import { VolumeNotFoundError } from '@/@errors/volumes-errors';
import { VolumeStatus } from '@/entities/stock/value-objects/volume-status';
import type { VolumeDTO } from '@/mappers/stock/volume.mapper';
import { VolumeMapper } from '@/mappers/stock/volume.mapper';
import type { VolumeRepository } from '@/repositories/stock/volumes-repository';

export interface ReturnVolumeUseCaseRequest {
  volumeId: string;
}

export interface ReturnVolumeUseCaseResponse {
  volume: VolumeDTO;
}

export class ReturnVolumeUseCase {
  constructor(private volumesRepository: VolumeRepository) {}

  async execute(
    request: ReturnVolumeUseCaseRequest,
  ): Promise<ReturnVolumeUseCaseResponse> {
    const volume = await this.volumesRepository.findById(request.volumeId);
    if (!volume) {
      throw new VolumeNotFoundError(request.volumeId);
    }

    // Marcar como retornado
    volume.status = VolumeStatus.RETURNED;
    volume.returnedAt = new Date();
    volume.updatedAt = new Date();

    await this.volumesRepository.update(volume);

    const volumeDTO = VolumeMapper.toDTO(volume);

    return {
      volume: volumeDTO,
    };
  }
}
