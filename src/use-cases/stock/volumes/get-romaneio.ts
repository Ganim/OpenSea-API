import { VolumeNotFoundError } from '@/@errors/volumes-errors';
import type { VolumeItemDTO } from '@/mappers/stock/volume.mapper';
import type { VolumeRepository } from '@/repositories/stock/volumes-repository';

export interface GetRomaneioUseCaseRequest {
  tenantId: string;
  volumeId: string;
}

export interface GetRomaneioUseCaseResponse {
  romaneio: {
    volumeId: string;
    volumeCode: string;
    totalItems: number;
    items: VolumeItemDTO[];
    generatedAt: Date;
  };
}

export class GetRomaneioUseCase {
  constructor(private volumesRepository: VolumeRepository) {}

  async execute(
    request: GetRomaneioUseCaseRequest,
  ): Promise<GetRomaneioUseCaseResponse> {
    const volume = await this.volumesRepository.findById(
      request.volumeId,
      request.tenantId,
    );
    if (!volume) {
      throw new VolumeNotFoundError(request.volumeId);
    }

    // Obter itens do volume
    const items = await this.volumesRepository.getItemsByVolumeId(
      request.volumeId,
    );

    // Mapear para DTO
    const itemDTOs = items.map((item) => ({
      id: item.id.toString(),
      volumeId: item.volumeId,
      itemId: item.itemId,
      addedAt: item.addedAt,
      addedBy: item.addedBy,
    }));

    return {
      romaneio: {
        volumeId: volume.id.toString(),
        volumeCode: volume.code,
        totalItems: items.length,
        items: itemDTOs,
        generatedAt: new Date(),
      },
    };
  }
}
