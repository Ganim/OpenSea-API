import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import type { BinsRepository } from '@/repositories/stock/bins-repository';
import type { WarehousesRepository } from '@/repositories/stock/warehouses-repository';
import type { ZonesRepository } from '@/repositories/stock/zones-repository';

export interface LabelPreviewData {
  binId: string;
  address: string;
  warehouseCode: string;
  warehouseName: string;
  zoneCode: string;
  zoneName: string;
  aisle: number;
  shelf: number;
  position: string;
  codeData: string;
  occupancy: {
    current: number;
    capacity: number | null;
  };
}

interface GetLabelPreviewUseCaseRequest {
  binId: string;
}

interface GetLabelPreviewUseCaseResponse {
  preview: LabelPreviewData;
}

export class GetLabelPreviewUseCase {
  constructor(
    private binsRepository: BinsRepository,
    private zonesRepository: ZonesRepository,
    private warehousesRepository: WarehousesRepository,
  ) {}

  async execute(
    input: GetLabelPreviewUseCaseRequest,
  ): Promise<GetLabelPreviewUseCaseResponse> {
    const { binId } = input;

    // Fetch the bin
    const bin = await this.binsRepository.findById(new UniqueEntityID(binId));

    if (!bin) {
      throw new ResourceNotFoundError('Bin não encontrado');
    }

    // Fetch the zone
    const zone = await this.zonesRepository.findById(bin.zoneId);

    if (!zone) {
      throw new ResourceNotFoundError('Zona não encontrada');
    }

    // Fetch the warehouse
    const warehouse = await this.warehousesRepository.findById(
      zone.warehouseId,
    );

    if (!warehouse) {
      throw new ResourceNotFoundError('Armazém não encontrado');
    }

    return {
      preview: {
        binId: bin.binId.toString(),
        address: bin.address,
        warehouseCode: warehouse.code,
        warehouseName: warehouse.name,
        zoneCode: zone.code,
        zoneName: zone.name,
        aisle: bin.aisle,
        shelf: bin.shelf,
        position: bin.position,
        codeData: bin.address,
        occupancy: {
          current: bin.currentOccupancy,
          capacity: bin.capacity,
        },
      },
    };
  }
}
