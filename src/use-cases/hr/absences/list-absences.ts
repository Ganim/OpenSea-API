import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import type { Absence } from '@/entities/hr/absence';
import type { FindAbsenceFilters } from '@/repositories/hr/absences-repository';
import { AbsencesRepository } from '@/repositories/hr/absences-repository';

export interface ListAbsencesRequest {
  tenantId: string;
  employeeId?: string;
  type?: string;
  status?: string;
  startDate?: Date;
  endDate?: Date;
}

export interface ListAbsencesResponse {
  absences: Absence[];
}

export class ListAbsencesUseCase {
  constructor(private absencesRepository: AbsencesRepository) {}

  async execute(request: ListAbsencesRequest): Promise<ListAbsencesResponse> {
    const { tenantId, employeeId, type, status, startDate, endDate } = request;

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

    const absences = await this.absencesRepository.findMany(tenantId, filters);

    return {
      absences,
    };
  }
}
