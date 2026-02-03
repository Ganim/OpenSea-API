import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import type { ItemDTO } from '@/mappers/stock/item/item-to-dto';
import { itemToDTO } from '@/mappers/stock/item/item-to-dto';
import type { ItemsRepository } from '@/repositories/stock/items-repository';

interface ListItemsByProductIdUseCaseRequest {
  tenantId: string;
  productId: string;
}

interface ListItemsByProductIdUseCaseResponse {
  items: ItemDTO[];
}

export class ListItemsByProductIdUseCase {
  constructor(private itemsRepository: ItemsRepository) {}

  async execute(
    input: ListItemsByProductIdUseCaseRequest,
  ): Promise<ListItemsByProductIdUseCaseResponse> {
    const itemsWithRelations =
      await this.itemsRepository.findManyByProductWithRelations(
        new UniqueEntityID(input.productId),
        input.tenantId,
      );

    return {
      items: itemsWithRelations.map(({ item, relatedData }) =>
        itemToDTO(item, relatedData),
      ),
    };
  }
}
