import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import type { ItemDTO } from '@/mappers/stock/item/item-to-dto';
import { itemToDTO } from '@/mappers/stock/item/item-to-dto';
import { ItemsRepository } from '@/repositories/stock/items-repository';

interface ListItemsByLocationIdUseCaseRequest {
  locationId: string;
}

interface ListItemsByLocationIdUseCaseResponse {
  items: ItemDTO[];
}

export class ListItemsByLocationIdUseCase {
  constructor(private itemsRepository: ItemsRepository) {}

  async execute(
    input: ListItemsByLocationIdUseCaseRequest,
  ): Promise<ListItemsByLocationIdUseCaseResponse> {
    const items = await this.itemsRepository.findManyByLocation(
      new UniqueEntityID(input.locationId),
    );

    // Since the repository doesn't return related data directly, we'll need to fetch it separately
    // For now, we'll use a simplified approach
    return {
      items: items.map((item) => {
        // TODO: Fetch related data (product and variant info) for each item
        const relatedData = {
          productCode: '',
          productName: '',
          variantSku: '',
          variantName: '',
        };

        return itemToDTO(item, relatedData);
      }),
    };
  }
}