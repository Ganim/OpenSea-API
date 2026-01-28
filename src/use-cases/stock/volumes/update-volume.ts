import {
  InvalidVolumeStatusError,
  VolumeNotFoundError,
} from '@/@errors/volumes-errors';
import {
  VolumeStatus,
  isValidVolumeStatus,
} from '@/entities/stock/value-objects/volume-status';
import type { VolumeDTO } from '@/mappers/stock/volume.mapper';
import { VolumeMapper } from '@/mappers/stock/volume.mapper';
import type { VolumeRepository } from '@/repositories/stock/volumes-repository';

export interface UpdateVolumeUseCaseRequest {
  volumeId: string;
  name?: string;
  notes?: string;
  destinationRef?: string;
  status?: string;
}

export interface UpdateVolumeUseCaseResponse {
  volume: VolumeDTO;
}

export class UpdateVolumeUseCase {
  constructor(private volumesRepository: VolumeRepository) {}

  async execute(
    request: UpdateVolumeUseCaseRequest,
  ): Promise<UpdateVolumeUseCaseResponse> {
    const volume = await this.volumesRepository.findById(request.volumeId);
    if (!volume) {
      throw new VolumeNotFoundError(request.volumeId);
    }

    // Atualizar campos
    if (request.name !== undefined) {
      volume.name = request.name;
    }

    if (request.notes !== undefined) {
      volume.notes = request.notes;
    }

    if (request.destinationRef !== undefined) {
      volume.destinationRef = request.destinationRef;
    }

    if (request.status !== undefined) {
      if (!isValidVolumeStatus(request.status)) {
        throw new InvalidVolumeStatusError(request.status);
      }
      volume.status = request.status as VolumeStatus;
    }

    volume.updatedAt = new Date();

    await this.volumesRepository.update(volume);

    const volumeDTO = VolumeMapper.toDTO(volume);

    return {
      volume: volumeDTO,
    };
  }
}
