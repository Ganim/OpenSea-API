import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import type { VacationPeriod } from '@/entities/hr/vacation-period';
import type { FindVacationPeriodFilters } from '@/repositories/hr/vacation-periods-repository';
import { VacationPeriodsRepository } from '@/repositories/hr/vacation-periods-repository';

export interface ListVacationPeriodsRequest {
  tenantId: string;
  employeeId?: string;
  status?: string;
  year?: number;
}

export interface ListVacationPeriodsResponse {
  vacationPeriods: VacationPeriod[];
}

export class ListVacationPeriodsUseCase {
  constructor(private vacationPeriodsRepository: VacationPeriodsRepository) {}

  async execute(
    request: ListVacationPeriodsRequest,
  ): Promise<ListVacationPeriodsResponse> {
    const { tenantId, employeeId, status, year } = request;

    const filters: FindVacationPeriodFilters = {};

    if (employeeId) {
      filters.employeeId = new UniqueEntityID(employeeId);
    }
    if (status) {
      filters.status = status;
    }
    if (year) {
      filters.year = year;
    }

    const vacationPeriods = await this.vacationPeriodsRepository.findMany(
      tenantId,
      filters,
    );

    return {
      vacationPeriods,
    };
  }
}
