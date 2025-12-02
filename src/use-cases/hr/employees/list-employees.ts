import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import { Employee } from '@/entities/hr/employee';
import { EmployeeStatus } from '@/entities/hr/value-objects';
import { EmployeesRepository } from '@/repositories/hr/employees-repository';

export interface ListEmployeesRequest {
  page?: number;
  perPage?: number;
  status?: string;
  departmentId?: string;
  positionId?: string;
  supervisorId?: string;
  search?: string;
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
      page = 1,
      perPage = 20,
      status,
      departmentId,
      positionId,
      supervisorId,
      search,
    } = request;

    let employees: Employee[];

    // Get employees based on filters
    if (status) {
      const statusVO = this.mapStatus(status);
      employees = await this.employeesRepository.findManyByStatus(statusVO);
    } else if (departmentId) {
      employees = await this.employeesRepository.findManyByDepartment(
        new UniqueEntityID(departmentId),
      );
    } else if (positionId) {
      employees = await this.employeesRepository.findManyByPosition(
        new UniqueEntityID(positionId),
      );
    } else if (supervisorId) {
      employees = await this.employeesRepository.findManyBySupervisor(
        new UniqueEntityID(supervisorId),
      );
    } else {
      employees = await this.employeesRepository.findMany();
    }

    // Apply search filter
    if (search) {
      const searchLower = search.toLowerCase();
      employees = employees.filter(
        (employee) =>
          employee.fullName.toLowerCase().includes(searchLower) ||
          employee.registrationNumber.toLowerCase().includes(searchLower) ||
          employee.email?.toLowerCase().includes(searchLower) ||
          employee.cpf.value.includes(search),
      );
    }

    // Calculate pagination
    const total = employees.length;
    const totalPages = Math.ceil(total / perPage);
    const startIndex = (page - 1) * perPage;
    const endIndex = startIndex + perPage;

    // Apply pagination
    const paginatedEmployees = employees.slice(startIndex, endIndex);

    return {
      employees: paginatedEmployees,
      meta: {
        total,
        page,
        perPage,
        totalPages,
      },
    };
  }

  private mapStatus(status: string): EmployeeStatus {
    switch (status.toUpperCase()) {
      case 'ACTIVE':
        return EmployeeStatus.ACTIVE();
      case 'ON_LEAVE':
        return EmployeeStatus.ON_LEAVE();
      case 'VACATION':
        return EmployeeStatus.VACATION();
      case 'SUSPENDED':
        return EmployeeStatus.SUSPENDED();
      case 'TERMINATED':
        return EmployeeStatus.TERMINATED();
      default:
        throw new Error(`Invalid status: ${status}`);
    }
  }
}
