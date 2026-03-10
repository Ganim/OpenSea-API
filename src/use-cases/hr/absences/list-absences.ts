import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import type { Absence } from '@/entities/hr/absence';
import type { FindAbsenceFilters } from '@/repositories/hr/absences-repository';
import { AbsencesRepository } from '@/repositories/hr/absences-repository';

export interface ListAbsencesRequest {
  tenantId: string;
  page?: number;
  perPage?: number;
  employeeId?: string;
  type?: string;
  status?: string;
  startDate?: Date;
  endDate?: Date;
}

export interface ListAbsencesResponse {
  absences: Absence[];
  meta: {
    total: number;
    page: number;
    perPage: number;
    totalPages: number;
  };
}

export class ListAbsencesUseCase {
  constructor(private absencesRepository: AbsencesRepository) {}

  async execute(request: ListAbsencesRequest): Promise<ListAbsencesResponse> {
    const {
      tenantId,
      page = 1,
      perPage = 20,
      employeeId,
      type,
      status,
      startDate,
      endDate,
    } = request;

    const skip = (page - 1) * perPage;

    const filters: FindAbsenceFilters = {};

    if (employeeId) {
      filters.employeeId = new UniqueEntityID(employeeId);
    }
    if (type) {
      filters.type = type;
    }
    if (status) {
      filters.status = status;
    }
    if (startDate) {
      filters.startDate = startDate;
    }
    if (endDate) {
      filters.endDate = endDate;
    }

    const { absences, total } = await this.absencesRepository.findManyPaginated(
      tenantId,
      filters,
      skip,
      perPage,
    );

    const totalPages = Math.ceil(total / perPage);

    return {
      absences,
      meta: {
        total,
        page,
        perPage,
        totalPages,
      },
    };
  }
}
