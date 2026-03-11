import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import type { ItemDTO } from '@/mappers/stock/item/item-to-dto';
import { itemToDTO } from '@/mappers/stock/item/item-to-dto';
import type { ItemsRepository } from '@/repositories/stock/items-repository';

interface ListItemsByProductIdUseCaseRequest {
  tenantId: string;
  productId: string;
  page?: number;
  limit?: number;
}

interface ListItemsByProductIdUseCaseResponse {
  items: ItemDTO[];
  meta: {
    total: number;
    page: number;
    limit: number;
    pages: number;
  };
}

export class ListItemsByProductIdUseCase {
  constructor(private itemsRepository: ItemsRepository) {}

  async execute(
    input: ListItemsByProductIdUseCaseRequest,
  ): Promise<ListItemsByProductIdUseCaseResponse> {
    const page = input.page ?? 1;
    const limit = input.limit ?? 20;

    const result =
      await this.itemsRepository.findManyByProductWithRelationsPaginated(
        new UniqueEntityID(input.productId),
        input.tenantId,
        { page, limit },
      );

    return {
      items: result.data.map(({ item, relatedData }) =>
        itemToDTO(item, relatedData),
      ),
      meta: {
        total: result.total,
        page: result.page,
        limit: result.limit,
        pages: result.totalPages,
      },
    };
  }
}
