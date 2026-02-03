import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import type { Bin } from '@/entities/stock/bin';
import type { BinsRepository } from '@/repositories/stock/bins-repository';
import type { ZonesRepository } from '@/repositories/stock/zones-repository';
import type { WarehousesRepository } from '@/repositories/stock/warehouses-repository';
import type { ItemsRepository } from '@/repositories/stock/items-repository';

interface BinItemDTO {
  id: string;
  itemCode: string;
  sku: string;
  productName: string;
  variantName: string | null;
  quantity: number;
  addedAt: Date;
}

interface GetBinDetailUseCaseRequest {
  tenantId: string;
  id: string;
}

interface GetBinDetailUseCaseResponse {
  bin: Bin;
  itemCount: number;
  items: BinItemDTO[];
  zone: {
    id: string;
    code: string;
    name: string;
  };
  warehouse: {
    id: string;
    code: string;
    name: string;
  };
}

export class GetBinDetailUseCase {
  constructor(
    private binsRepository: BinsRepository,
    private itemsRepository: ItemsRepository,
    private zonesRepository: ZonesRepository,
    private warehousesRepository: WarehousesRepository,
  ) {}

  async execute({
    tenantId,
    id,
  }: GetBinDetailUseCaseRequest): Promise<GetBinDetailUseCaseResponse> {
    const binId = new UniqueEntityID(id);

    const bin = await this.binsRepository.findById(binId, tenantId);

    if (!bin) {
      throw new ResourceNotFoundError('Bin');
    }

    const zone = await this.zonesRepository.findById(bin.zoneId, tenantId);

    if (!zone) {
      throw new ResourceNotFoundError('Zone');
    }

    const warehouse = await this.warehousesRepository.findById(
      zone.warehouseId,
      tenantId,
    );

    if (!warehouse) {
      throw new ResourceNotFoundError('Warehouse');
    }

    const itemCount = await this.binsRepository.countItemsInBin(binId);

    // Get items in the bin with their variant and product info
    const itemsWithRelations =
      await this.itemsRepository.findManyByBinWithRelations(binId, tenantId);

    const items: BinItemDTO[] = itemsWithRelations
      .filter(
        (itemDTO) =>
          itemDTO.item.currentQuantity > 0 && itemDTO.item.status.isAvailable,
      )
      .map((itemDTO) => ({
        id: itemDTO.item.id.toString(),
        itemCode:
          itemDTO.item.fullCode ||
          itemDTO.item.uniqueCode ||
          itemDTO.item.id.toString().slice(0, 8),
        sku:
          itemDTO.relatedData.variantSku ||
          itemDTO.item.uniqueCode ||
          itemDTO.item.id.toString().slice(0, 8),
        productName: itemDTO.relatedData.productName,
        variantName: itemDTO.relatedData.variantName || null,
        quantity: itemDTO.item.currentQuantity,
        addedAt: itemDTO.item.entryDate,
      }));

    return {
      bin,
      itemCount,
      items,
      zone: {
        id: zone.zoneId.toString(),
        code: zone.code,
        name: zone.name,
      },
      warehouse: {
        id: warehouse.warehouseId.toString(),
        code: warehouse.code,
        name: warehouse.name,
      },
    };
  }
}
