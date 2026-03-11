import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import type { ItemDTO } from '@/mappers/stock/item/item-to-dto';
import { itemToDTO } from '@/mappers/stock/item/item-to-dto';
import type { ItemsRepository } from '@/repositories/stock/items-repository';

interface ListItemsByVariantIdUseCaseRequest {
  tenantId: string;
  variantId: string;
  page?: number;
  limit?: number;
}

interface ListItemsByVariantIdUseCaseResponse {
  items: ItemDTO[];
  meta: {
    total: number;
    page: number;
    limit: number;
    pages: number;
  };
}

export class ListItemsByVariantIdUseCase {
  constructor(private itemsRepository: ItemsRepository) {}

  async execute(
    input: ListItemsByVariantIdUseCaseRequest,
  ): Promise<ListItemsByVariantIdUseCaseResponse> {
    const page = input.page ?? 1;
    const limit = input.limit ?? 20;

    const result =
      await this.itemsRepository.findManyByVariantWithRelationsPaginated(
        new UniqueEntityID(input.variantId),
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
