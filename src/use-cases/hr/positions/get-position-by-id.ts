import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import type { Company } from '@/entities/hr/company';
import type { Department } from '@/entities/hr/department';
import type { Employee } from '@/entities/hr/employee';
import type { Position } from '@/entities/hr/position';
import type { CompaniesRepository } from '@/repositories/hr/companies-repository';
import type { DepartmentsRepository } from '@/repositories/hr/departments-repository';
import type { EmployeesRepository } from '@/repositories/hr/employees-repository';
import type { PositionsRepository } from '@/repositories/hr/positions-repository';

export interface GetPositionByIdRequest {
  tenantId: string;
  id: string;
  includeEmployees?: boolean;
}

export interface GetPositionByIdResponse {
  position: Position;
  department: Department | null;
  company: Company | null;
  employeesCount: number;
  employees?: Employee[];
}

export class GetPositionByIdUseCase {
  constructor(
    private positionsRepository: PositionsRepository,
    private departmentsRepository: DepartmentsRepository,
    private companiesRepository: CompaniesRepository,
    private employeesRepository: EmployeesRepository,
  ) {}

  async execute(
    request: GetPositionByIdRequest,
  ): Promise<GetPositionByIdResponse> {
    const { id, includeEmployees = false } = request;

    const { tenantId } = request;

    const position = await this.positionsRepository.findById(
      new UniqueEntityID(id),
      tenantId,
    );

    if (!position) {
      throw new Error('Position not found');
    }

    // Get department if position has one
    let department: Department | null = null;
    let company: Company | null = null;

    if (position.departmentId) {
      department = await this.departmentsRepository.findById(
        position.departmentId,
        tenantId,
      );

      // Get company from department
      if (department) {
        company = await this.companiesRepository.findById(
          department.companyId,
          tenantId,
        );
      }
    }

    // Get employees count
    const employeesCount =
      await this.positionsRepository.countEmployeesByPosition(position.id);

    // Get employees list if requested
    let employees: Employee[] | undefined;
    if (includeEmployees) {
      employees = await this.employeesRepository.findManyByPosition(
        position.id,
        tenantId,
      );
    }

    return {
      position,
      department,
      company,
      employeesCount,
      employees,
    };
  }
}
