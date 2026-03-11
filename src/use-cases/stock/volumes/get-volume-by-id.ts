import { VolumeNotFoundError } from '@/@errors/volumes-errors';
import type { VolumeDTO } from '@/mappers/stock/volume/volume-to-dto';
import { volumeToDTO } from '@/mappers/stock/volume/volume-to-dto';
import type { VolumeRepository } from '@/repositories/stock/volumes-repository';

export interface GetVolumeByIdUseCaseRequest {
  tenantId: string;
  volumeId: string;
}

export interface GetVolumeByIdUseCaseResponse {
  volume: VolumeDTO & { itemCount: number };
}

export class GetVolumeByIdUseCase {
  constructor(private volumesRepository: VolumeRepository) {}

  async execute(
    request: GetVolumeByIdUseCaseRequest,
  ): Promise<GetVolumeByIdUseCaseResponse> {
    const volume = await this.volumesRepository.findById(
      request.volumeId,
      request.tenantId,
    );
    if (!volume) {
      throw new VolumeNotFoundError(request.volumeId);
    }

    const itemCount = await this.volumesRepository.countItemsByVolumeId(
      request.volumeId,
    );

    const volumeDTO = volumeToDTO(volume);

    return {
      volume: {
        ...volumeDTO,
        itemCount,
      },
    };
  }
}
