import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import { ItemStatus } from '@/entities/stock/value-objects/item-status';
import type { ItemDTO } from '@/mappers/stock/item/item-to-dto';
import { itemToDTO } from '@/mappers/stock/item/item-to-dto';
import type {
  ItemsRepository,
  ItemWithRelationsDTO,
} from '@/repositories/stock/items-repository';

interface ListItemsUseCaseRequest {
  tenantId: string;
  variantId?: string;
  binId?: string;
  status?: string;
  batchNumber?: string;
  productId?: string;
  page?: number;
  limit?: number;
}

interface ListItemsUseCaseResponse {
  items: ItemDTO[];
  meta: {
    total: number;
    page: number;
    limit: number;
    pages: number;
  };
}

export class ListItemsUseCase {
  constructor(private itemsRepository: ItemsRepository) {}

  async execute(
    input: ListItemsUseCaseRequest,
  ): Promise<ListItemsUseCaseResponse> {
    const { tenantId } = input;
    const page = input.page ?? 1;
    const limit = input.limit ?? 20;

    // Filters with paginated repository methods
    if (input.productId) {
      const result =
        await this.itemsRepository.findManyByProductWithRelationsPaginated(
          new UniqueEntityID(input.productId),
          tenantId,
          { page, limit },
        );

      return this.buildResponse(
        result.data,
        result.total,
        result.page,
        result.limit,
        result.totalPages,
      );
    }

    if (input.variantId) {
      const result =
        await this.itemsRepository.findManyByVariantWithRelationsPaginated(
          new UniqueEntityID(input.variantId),
          tenantId,
          { page, limit },
        );

      return this.buildResponse(
        result.data,
        result.total,
        result.page,
        result.limit,
        result.totalPages,
      );
    }

    if (input.binId) {
      const allItems = await this.itemsRepository.findManyByBinWithRelations(
        new UniqueEntityID(input.binId),
        tenantId,
      );

      return this.paginateInMemory(allItems, page, limit);
    }

    if (input.status) {
      const items = await this.itemsRepository.findManyByStatus(
        ItemStatus.create(
          input.status as
            | 'AVAILABLE'
            | 'RESERVED'
            | 'IN_TRANSIT'
            | 'DAMAGED'
            | 'EXPIRED'
            | 'DISPOSED',
        ),
        tenantId,
      );
      const itemsWithRelations: ItemWithRelationsDTO[] = items.map((item) => ({
        item,
        relatedData: {
          productCode: null,
          productName: '',
          variantSku: '',
          variantName: '',
        },
      }));

      return this.paginateInMemory(itemsWithRelations, page, limit);
    }

    if (input.batchNumber) {
      const items = await this.itemsRepository.findManyByBatch(
        input.batchNumber,
        tenantId,
      );
      const itemsWithRelations: ItemWithRelationsDTO[] = items.map((item) => ({
        item,
        relatedData: {
          productCode: null,
          productName: '',
          variantSku: '',
          variantName: '',
        },
      }));

      return this.paginateInMemory(itemsWithRelations, page, limit);
    }

    // No filters — use paginated repository method
    const result = await this.itemsRepository.findAllWithRelationsPaginated(
      tenantId,
      { page, limit },
    );

    return this.buildResponse(
      result.data,
      result.total,
      result.page,
      result.limit,
      result.totalPages,
    );
  }

  private buildResponse(
    items: ItemWithRelationsDTO[],
    total: number,
    page: number,
    limit: number,
    pages: number,
  ): ListItemsUseCaseResponse {
    return {
      items: items.map(({ item, relatedData }) => itemToDTO(item, relatedData)),
      meta: { total, page, limit, pages },
    };
  }

  private paginateInMemory(
    items: ItemWithRelationsDTO[],
    page: number,
    limit: number,
  ): ListItemsUseCaseResponse {
    const total = items.length;
    const start = (page - 1) * limit;
    const paginated = items.slice(start, start + limit);

    return this.buildResponse(
      paginated,
      total,
      page,
      limit,
      Math.ceil(total / limit),
    );
  }
}
