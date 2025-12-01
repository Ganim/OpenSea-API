import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import { Position } from '@/entities/hr/position';
import { PositionsRepository } from '@/repositories/hr/positions-repository';

export interface ListPositionsRequest {
  page?: number;
  perPage?: number;
  search?: string;
  isActive?: boolean;
  departmentId?: string;
  level?: number;
}

export interface ListPositionsResponse {
  positions: Position[];
  meta: {
    total: number;
    page: number;
    perPage: number;
    totalPages: number;
  };
}

export class ListPositionsUseCase {
  constructor(private positionsRepository: PositionsRepository) {}

  async execute(request: ListPositionsRequest): Promise<ListPositionsResponse> {
    const {
      page = 1,
      perPage = 20,
      search,
      isActive,
      departmentId,
      level,
    } = request;

    const result = await this.positionsRepository.findMany({
      page,
      perPage,
      search,
      isActive,
      departmentId: departmentId ? new UniqueEntityID(departmentId) : undefined,
      level,
    });

    const totalPages = Math.ceil(result.total / perPage);

    return {
      positions: result.positions,
      meta: {
        total: result.total,
        page,
        perPage,
        totalPages,
      },
    };
  }
}
