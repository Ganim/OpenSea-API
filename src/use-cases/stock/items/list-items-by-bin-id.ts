import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import type { ItemDTO } from '@/mappers/stock/item/item-to-dto';
import { itemToDTO } from '@/mappers/stock/item/item-to-dto';
import type { ItemsRepository } from '@/repositories/stock/items-repository';

interface ListItemsByBinIdUseCaseRequest {
  tenantId: string;
  binId: string;
}

interface ListItemsByBinIdUseCaseResponse {
  items: ItemDTO[];
}

export class ListItemsByBinIdUseCase {
  constructor(private itemsRepository: ItemsRepository) {}

  async execute(
    input: ListItemsByBinIdUseCaseRequest,
  ): Promise<ListItemsByBinIdUseCaseResponse> {
    const itemsWithRelations =
      await this.itemsRepository.findManyByBinWithRelations(
        new UniqueEntityID(input.binId),
        input.tenantId,
      );

    return {
      items: itemsWithRelations.map(({ item, relatedData }) =>
        itemToDTO(item, relatedData),
      ),
    };
  }
}
