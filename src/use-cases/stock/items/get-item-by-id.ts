import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import type { ItemDTO } from '@/mappers/stock/item/item-to-dto';
import { itemToDTO } from '@/mappers/stock/item/item-to-dto';
import { ItemsRepository } from '@/repositories/stock/items-repository';

interface GetItemByIdUseCaseRequest {
  id: string;
}

interface GetItemByIdUseCaseResponse {
  item: ItemDTO;
}

export class GetItemByIdUseCase {
  constructor(private itemsRepository: ItemsRepository) {}

  async execute(
    input: GetItemByIdUseCaseRequest,
  ): Promise<GetItemByIdUseCaseResponse> {
    const item = await this.itemsRepository.findById(
      new UniqueEntityID(input.id),
    );

    if (!item) {
      throw new ResourceNotFoundError('Item not found.');
    }

    return {
      item: itemToDTO(item),
    };
  }
}
