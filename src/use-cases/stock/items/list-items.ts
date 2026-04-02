import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import type { ItemDTO } from '@/mappers/stock/item/item-to-dto';
import { itemToDTO } from '@/mappers/stock/item/item-to-dto';
import type {
  ItemListFilters,
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
  search?: string;
  manufacturerId?: string;
  zoneId?: string;
  hideEmpty?: boolean;
  updatedFrom?: Date;
  updatedTo?: Date;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
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

    // Build filters for the paginated repository method
    const filters: ItemListFilters = {};
    if (input.search) filters.search = input.search;
    if (input.manufacturerId) filters.manufacturerId = input.manufacturerId;
    if (input.zoneId) filters.zoneId = input.zoneId;
    if (input.status) filters.status = input.status;
    if (input.hideEmpty) filters.hideEmpty = input.hideEmpty;
    if (input.updatedFrom) filters.updatedFrom = input.updatedFrom;
    if (input.updatedTo) filters.updatedTo = input.updatedTo;
    if (input.sortBy) filters.sortBy = input.sortBy;
    if (input.sortOrder) filters.sortOrder = input.sortOrder;

    const hasFilters = Object.keys(filters).length > 0;

    const result = await this.itemsRepository.findAllWithRelationsPaginated(
      tenantId,
      { page, limit },
      hasFilters ? filters : undefined,
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
