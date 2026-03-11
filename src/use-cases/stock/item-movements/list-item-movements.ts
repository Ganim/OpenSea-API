import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import { ItemMovement } from '@/entities/stock/item-movement';
import { MovementType } from '@/entities/stock/value-objects/movement-type';
import type { ItemMovementDTO } from '@/mappers/stock/item-movement/item-movement-to-dto';
import { itemMovementToDTO } from '@/mappers/stock/item-movement/item-movement-to-dto';
import { ItemMovementsRepository } from '@/repositories/stock/item-movements-repository';
import type { PaginatedResult } from '@/repositories/pagination-params';

interface ListItemMovementsRequest {
  tenantId: string;
  itemId?: string;
  userId?: string;
  movementType?: string;
  salesOrderId?: string;
  batchNumber?: string;
  pendingApproval?: boolean;
  page?: number;
  limit?: number;
}

interface ListItemMovementsResponse {
  movements: ItemMovementDTO[];
  meta: {
    total: number;
    page: number;
    limit: number;
    pages: number;
  };
}

export class ListItemMovementsUseCase {
  constructor(private itemMovementsRepository: ItemMovementsRepository) {}

  async execute(
    input: ListItemMovementsRequest,
  ): Promise<ListItemMovementsResponse> {
    const { tenantId } = input;
    const page = input.page ?? 1;
    const limit = input.limit ?? 20;
    const paginationParams = { page, limit };

    // Filters with paginated repository methods
    if (input.pendingApproval) {
      // pendingApproval doesn't have a paginated variant — paginate in-memory
      const movements =
        await this.itemMovementsRepository.findManyPendingApproval(tenantId);
      return this.paginateInMemory(movements, page, limit);
    }

    if (input.itemId) {
      const result = await this.itemMovementsRepository.findManyByItemPaginated(
        new UniqueEntityID(input.itemId),
        tenantId,
        paginationParams,
      );
      return this.buildResponse(result);
    }

    if (input.userId) {
      const result = await this.itemMovementsRepository.findManyByUserPaginated(
        new UniqueEntityID(input.userId),
        tenantId,
        paginationParams,
      );
      return this.buildResponse(result);
    }

    if (input.movementType) {
      const result = await this.itemMovementsRepository.findManyByTypePaginated(
        MovementType.create(
          input.movementType as
            | 'SALE'
            | 'PRODUCTION'
            | 'SAMPLE'
            | 'LOSS'
            | 'TRANSFER'
            | 'INVENTORY_ADJUSTMENT',
        ),
        tenantId,
        paginationParams,
      );
      return this.buildResponse(result);
    }

    if (input.salesOrderId) {
      const result =
        await this.itemMovementsRepository.findManyBySalesOrderPaginated(
          new UniqueEntityID(input.salesOrderId),
          tenantId,
          paginationParams,
        );
      return this.buildResponse(result);
    }

    if (input.batchNumber) {
      const result =
        await this.itemMovementsRepository.findManyByBatchPaginated(
          input.batchNumber,
          tenantId,
          paginationParams,
        );
      return this.buildResponse(result);
    }

    // No filters — paginated
    const result = await this.itemMovementsRepository.findAllPaginated(
      tenantId,
      paginationParams,
    );
    return this.buildResponse(result);
  }

  private buildResponse(
    result: PaginatedResult<ItemMovement>,
  ): ListItemMovementsResponse {
    return {
      movements: result.data.map(itemMovementToDTO),
      meta: {
        total: result.total,
        page: result.page,
        limit: result.limit,
        pages: result.totalPages,
      },
    };
  }

  private paginateInMemory(
    movements: ItemMovement[],
    page: number,
    limit: number,
  ): ListItemMovementsResponse {
    const total = movements.length;
    const start = (page - 1) * limit;
    const paginated = movements.slice(start, start + limit);

    return {
      movements: paginated.map(itemMovementToDTO),
      meta: {
        total,
        page,
        limit,
        pages: Math.ceil(total / limit),
      },
    };
  }
}
