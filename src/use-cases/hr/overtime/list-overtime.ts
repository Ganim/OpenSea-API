import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import type { Overtime } from '@/entities/hr/overtime';
import { OvertimeRepository } from '@/repositories/hr/overtime-repository';

export interface ListOvertimeRequest {
  tenantId: string;
  page?: number;
  perPage?: number;
  employeeId?: string;
  startDate?: Date;
  endDate?: Date;
  approved?: boolean;
}

export interface ListOvertimeResponse {
  overtimes: Overtime[];
  /** @deprecated Use meta.total instead */
  total: number;
  meta: {
    total: number;
    page: number;
    perPage: number;
    totalPages: number;
  };
}

export class ListOvertimeUseCase {
  constructor(private overtimeRepository: OvertimeRepository) {}

  async execute(request: ListOvertimeRequest): Promise<ListOvertimeResponse> {
    const {
      tenantId,
      page = 1,
      perPage = 20,
      employeeId,
      startDate,
      endDate,
      approved,
    } = request;

    const skip = (page - 1) * perPage;

    const { overtimes, total } =
      await this.overtimeRepository.findManyPaginated(
        tenantId,
        {
          employeeId: employeeId ? new UniqueEntityID(employeeId) : undefined,
          startDate,
          endDate,
          approved,
        },
        skip,
        perPage,
      );

    const totalPages = Math.ceil(total / perPage);

    return {
      overtimes,
      total,
      meta: {
        total,
        page,
        perPage,
        totalPages,
      },
    };
  }
}
