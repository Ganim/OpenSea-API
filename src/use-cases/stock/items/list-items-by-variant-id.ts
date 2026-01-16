import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import type { ItemDTO } from '@/mappers/stock/item/item-to-dto';
import { itemToDTO } from '@/mappers/stock/item/item-to-dto';
import type { ItemsRepository } from '@/repositories/stock/items-repository';

interface ListItemsByVariantIdUseCaseRequest {
  variantId: string;
}

interface ListItemsByVariantIdUseCaseResponse {
  items: ItemDTO[];
}

export class ListItemsByVariantIdUseCase {
  constructor(private itemsRepository: ItemsRepository) {}

  async execute(
    input: ListItemsByVariantIdUseCaseRequest,
  ): Promise<ListItemsByVariantIdUseCaseResponse> {
    const itemsWithRelations =
      await this.itemsRepository.findManyByVariantWithRelations(
        new UniqueEntityID(input.variantId),
      );

    return {
      items: itemsWithRelations.map(({ item, relatedData }) =>
        itemToDTO(item, relatedData),
      ),
    };
  }
}
