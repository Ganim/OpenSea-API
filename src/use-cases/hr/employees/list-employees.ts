import { BadRequestError } from '@/@errors/use-cases/bad-request-error';
import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import type { Employee } from '@/entities/hr/employee';
import type { FindEmployeeFilters } from '@/repositories/hr/employees-repository';
import { EmployeesRepository } from '@/repositories/hr/employees-repository';

export interface ListEmployeesRequest {
  tenantId: string;
  page?: number;
  perPage?: number;
  status?: string;
  departmentId?: string;
  positionId?: string;
  supervisorId?: string;
  companyId?: string;
  search?: string;
  unlinked?: boolean;
  includeDeleted?: boolean;
}

export interface ListEmployeesResponse {
  employees: Employee[];
  meta: {
    total: number;
    page: number;
    perPage: number;
    totalPages: number;
  };
}

export class ListEmployeesUseCase {
  constructor(private employeesRepository: EmployeesRepository) {}

  async execute(request: ListEmployeesRequest): Promise<ListEmployeesResponse> {
    const {
      tenantId,
      page = 1,
      perPage = 20,
      status,
      departmentId,
      positionId,
      supervisorId,
      companyId,
      search,
      unlinked = false,
      includeDeleted = false,
    } = request;

    if (status) {
      this.validateStatus(status);
    }

    const skip = (page - 1) * perPage;

    const filters: FindEmployeeFilters = {
      status,
      departmentId: departmentId ? new UniqueEntityID(departmentId) : undefined,
      positionId: positionId ? new UniqueEntityID(positionId) : undefined,
      supervisorId: supervisorId ? new UniqueEntityID(supervisorId) : undefined,
      companyId: companyId ? new UniqueEntityID(companyId) : undefined,
      search,
      unlinked,
      includeDeleted,
    };

    const { employees, total } =
      await this.employeesRepository.findManyPaginated(
        tenantId,
        filters,
        skip,
        perPage,
      );

    const totalPages = Math.ceil(total / perPage);

    return {
      employees,
      meta: {
        total,
        page,
        perPage,
        totalPages,
      },
    };
  }

  private validateStatus(status: string): void {
    const validStatuses = [
      'ACTIVE',
      'ON_LEAVE',
      'VACATION',
      'SUSPENDED',
      'TERMINATED',
    ];
    if (!validStatuses.includes(status.toUpperCase())) {
      throw new BadRequestError(`Invalid status: ${status}`);
    }
  }
}
