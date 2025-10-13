import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import { Item } from '@/entities/stock/item';
import { ItemStatus } from '@/entities/stock/value-objects/item-status';
import { ItemsRepository } from '@/repositories/stock/items-repository';

interface ListItemsUseCaseRequest {
  variantId?: string;
  locationId?: string;
  status?: string;
  batchNumber?: string;
}

interface ListItemsUseCaseResponse {
  items: Array<{
    id: string;
    uniqueCode: string;
    initialQuantity: number;
    currentQuantity: number;
    status: string;
    variantId: string;
    locationId: string;
    batchNumber: string | null;
    manufacturingDate: Date | null;
    expiryDate: Date | null;
    attributes: Record<string, unknown>;
    createdAt: Date;
    updatedAt: Date;
  }>;
}

export class ListItemsUseCase {
  constructor(private itemsRepository: ItemsRepository) {}

  async execute(
    input: ListItemsUseCaseRequest = {},
  ): Promise<ListItemsUseCaseResponse> {
    let items: Item[] = [];

    // Fetch items based on filters
    if (input.variantId) {
      items = await this.itemsRepository.findManyByVariant(
        new UniqueEntityID(input.variantId),
      );
    } else if (input.locationId) {
      items = await this.itemsRepository.findManyByLocation(
        new UniqueEntityID(input.locationId),
      );
    } else if (input.status) {
      items = await this.itemsRepository.findManyByStatus(
        ItemStatus.create(
          input.status as
            | 'AVAILABLE'
            | 'RESERVED'
            | 'IN_TRANSIT'
            | 'DAMAGED'
            | 'EXPIRED'
            | 'DISPOSED',
        ),
      );
    } else if (input.batchNumber) {
      items = await this.itemsRepository.findManyByBatch(input.batchNumber);
    } else {
      // If no filters, return empty array (or you could fetch all, but that's not ideal)
      items = [];
    }

    return {
      items: items.map((item) => ({
        id: item.id.toString(),
        uniqueCode: item.uniqueCode,
        initialQuantity: item.initialQuantity,
        currentQuantity: item.currentQuantity,
        status: item.status.value,
        variantId: item.variantId.toString(),
        locationId: item.locationId.toString(),
        batchNumber: item.batchNumber ?? null,
        manufacturingDate: item.manufacturingDate ?? null,
        expiryDate: item.expiryDate ?? null,
        attributes: item.attributes,
        createdAt: item.createdAt,
        updatedAt: item.updatedAt ?? item.createdAt,
      })),
    };
  }
}
