import {
  VolumeItemAlreadyExistsError,
  VolumeNotFoundError,
} from '@/@errors/volumes-errors';
import { VolumeItem } from '@/entities/stock/volume-item';
import type { VolumeItemDTO } from '@/mappers/stock/volume.mapper';
import { VolumeItemMapper } from '@/mappers/stock/volume.mapper';
import type { VolumeRepository } from '@/repositories/stock/volumes-repository';

export interface AddItemToVolumeUseCaseRequest {
  volumeId: string;
  itemId: string;
  addedBy: string;
}

export interface AddItemToVolumeUseCaseResponse {
  volumeItem: VolumeItemDTO;
}

export class AddItemToVolumeUseCase {
  constructor(private volumesRepository: VolumeRepository) {}

  async execute(
    request: AddItemToVolumeUseCaseRequest,
  ): Promise<AddItemToVolumeUseCaseResponse> {
    // Verificar se volume existe
    const volume = await this.volumesRepository.findById(request.volumeId);
    if (!volume) {
      throw new VolumeNotFoundError(request.volumeId);
    }

    // Verificar se item já existe no volume
    const existingItems = await this.volumesRepository.getItemsByVolumeId(
      request.volumeId,
    );
    const itemExists = existingItems.some(
      (item) => item.itemId === request.itemId,
    );
    if (itemExists) {
      throw new VolumeItemAlreadyExistsError(request.volumeId, request.itemId);
    }

    // Criar novo item de volume
    const volumeItem = VolumeItem.create({
      volumeId: request.volumeId,
      itemId: request.itemId,
      addedBy: request.addedBy,
    });

    await this.volumesRepository.addItem(volumeItem);

    const volumeItemDTO = VolumeItemMapper.toDTO(volumeItem);

    return {
      volumeItem: volumeItemDTO,
    };
  }
}
