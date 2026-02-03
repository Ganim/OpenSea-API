import {
  VolumeItemNotFoundError,
  VolumeNotFoundError,
} from '@/@errors/volumes-errors';
import type { VolumeRepository } from '@/repositories/stock/volumes-repository';

export interface RemoveItemFromVolumeUseCaseRequest {
  tenantId: string;
  volumeId: string;
  itemId: string;
}

export interface RemoveItemFromVolumeUseCaseResponse {
  success: boolean;
}

export class RemoveItemFromVolumeUseCase {
  constructor(private volumesRepository: VolumeRepository) {}

  async execute(
    request: RemoveItemFromVolumeUseCaseRequest,
  ): Promise<RemoveItemFromVolumeUseCaseResponse> {
    // Verificar se volume existe
    const volume = await this.volumesRepository.findById(
      request.volumeId,
      request.tenantId,
    );
    if (!volume) {
      throw new VolumeNotFoundError(request.volumeId);
    }

    // Verificar se item existe no volume
    const items = await this.volumesRepository.getItemsByVolumeId(
      request.volumeId,
    );
    const itemExists = items.some((item) => item.itemId === request.itemId);
    if (!itemExists) {
      throw new VolumeItemNotFoundError(request.volumeId, request.itemId);
    }

    await this.volumesRepository.removeItem(request.volumeId, request.itemId);

    return {
      success: true,
    };
  }
}
