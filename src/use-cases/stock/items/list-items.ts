import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import { Item } from '@/entities/stock/item';
import { ItemStatus } from '@/entities/stock/value-objects/item-status';
import type { ItemDTO } from '@/mappers/stock/item/item-to-dto';
import { itemToDTO } from '@/mappers/stock/item/item-to-dto';
import { ItemsRepository } from '@/repositories/stock/items-repository';

interface ListItemsUseCaseRequest {
  variantId?: string;
  locationId?: string;
  status?: string;
  batchNumber?: string;
}

interface ListItemsUseCaseResponse {
  items: ItemDTO[];
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
      // If no filters, return all items
      items = await this.itemsRepository.findAll();
    }

    return {
      items: items.map(itemToDTO),
    };
  }
}
