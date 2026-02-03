import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import type { Company } from '@/entities/hr/company';
import type { Department } from '@/entities/hr/department';
import type { Position } from '@/entities/hr/position';
import type { CompaniesRepository } from '@/repositories/hr/companies-repository';
import type { DepartmentsRepository } from '@/repositories/hr/departments-repository';
import type { PositionsRepository } from '@/repositories/hr/positions-repository';

export interface GetDepartmentByIdRequest {
  tenantId: string;
  id: string;
}

export interface GetDepartmentByIdResponse {
  department: Department;
  company: Company | null;
  positions: Position[];
  positionsCount: number;
}

export class GetDepartmentByIdUseCase {
  constructor(
    private departmentsRepository: DepartmentsRepository,
    private companiesRepository: CompaniesRepository,
    private positionsRepository: PositionsRepository,
  ) {}

  async execute(
    request: GetDepartmentByIdRequest,
  ): Promise<GetDepartmentByIdResponse> {
    const { id } = request;

    const { tenantId } = request;

    const department = await this.departmentsRepository.findById(
      new UniqueEntityID(id),
      tenantId,
    );

    if (!department) {
      throw new Error('Department not found');
    }

    // Get company
    const company = await this.companiesRepository.findById(
      department.companyId,
      tenantId,
    );

    // Get positions in this department
    const positions = await this.positionsRepository.findManyByDepartment(
      department.id,
      tenantId,
    );

    return {
      department,
      company,
      positions,
      positionsCount: positions.length,
    };
  }
}
