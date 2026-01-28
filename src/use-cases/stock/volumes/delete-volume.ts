import { VolumeNotFoundError } from '@/@errors/volumes-errors';
import type { VolumeRepository } from '@/repositories/stock/volumes-repository';

export interface DeleteVolumeUseCaseRequest {
  volumeId: string;
}

export interface DeleteVolumeUseCaseResponse {
  success: boolean;
}

export class DeleteVolumeUseCase {
  constructor(private volumesRepository: VolumeRepository) {}

  async execute(
    request: DeleteVolumeUseCaseRequest,
  ): Promise<DeleteVolumeUseCaseResponse> {
    const volume = await this.volumesRepository.findById(request.volumeId);
    if (!volume) {
      throw new VolumeNotFoundError(request.volumeId);
    }

    await this.volumesRepository.delete(request.volumeId);

    return {
      success: true,
    };
  }
}
