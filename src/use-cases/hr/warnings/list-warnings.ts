import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import type { EmployeeWarning } from '@/entities/hr/employee-warning';
import type { FindEmployeeWarningFilters } from '@/repositories/hr/employee-warnings-repository';
import type { EmployeeWarningsRepository } from '@/repositories/hr/employee-warnings-repository';

export interface ListWarningsRequest {
  tenantId: string;
  page?: number;
  perPage?: number;
  employeeId?: string;
  type?: string;
  severity?: string;
  status?: string;
}

export interface ListWarningsResponse {
  warnings: EmployeeWarning[];
  meta: {
    total: number;
    page: number;
    perPage: number;
    totalPages: number;
  };
}

export class ListWarningsUseCase {
  constructor(private employeeWarningsRepository: EmployeeWarningsRepository) {}

  async execute(request: ListWarningsRequest): Promise<ListWarningsResponse> {
    const {
      tenantId,
      page = 1,
      perPage = 20,
      employeeId,
      type,
      severity,
      status,
    } = request;

    const skip = (page - 1) * perPage;

    const filters: FindEmployeeWarningFilters = {};

    if (employeeId) {
      filters.employeeId = new UniqueEntityID(employeeId);
    }
    if (type) {
      filters.type = type;
    }
    if (severity) {
      filters.severity = severity;
    }
    if (status) {
      filters.status = status;
    }

    const { warnings, total } =
      await this.employeeWarningsRepository.findManyPaginated(
        tenantId,
        filters,
        skip,
        perPage,
      );

    const totalPages = Math.ceil(total / perPage);

    return {
      warnings,
      meta: {
        total,
        page,
        perPage,
        totalPages,
      },
    };
  }
}
