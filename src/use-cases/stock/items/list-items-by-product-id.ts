import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import type { ItemDTO } from '@/mappers/stock/item/item-to-dto';
import { itemToDTO } from '@/mappers/stock/item/item-to-dto';
import { ItemsRepository } from '@/repositories/stock/items-repository';

interface ListItemsByProductIdUseCaseRequest {
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
    const items = await this.itemsRepository.findManyByProduct(
      new UniqueEntityID(input.productId),
    );

    return {
      items: items.map(itemToDTO),
    };
  }
}
