import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import type { Company } from '@/entities/hr/company';
import type { Department } from '@/entities/hr/department';
import type { CompaniesRepository } from '@/repositories/hr/companies-repository';
import type { DepartmentsRepository } from '@/repositories/hr/departments-repository';

export interface GetCompanyByIdRequest {
  tenantId: string;
  id: string;
}

export interface GetCompanyByIdResponse {
  company: Company;
  departments: Department[];
  departmentsCount: number;
}

export class GetCompanyByIdUseCase {
  constructor(
    private companiesRepository: CompaniesRepository,
    private departmentsRepository: DepartmentsRepository,
  ) {}

  async execute(
    request: GetCompanyByIdRequest,
  ): Promise<GetCompanyByIdResponse> {
    const company = await this.companiesRepository.findById(
      new UniqueEntityID(request.id),
      request.tenantId,
    );

    if (!company) {
      throw new Error('Company not found');
    }

    // Get departments for this company
    const departments = await this.departmentsRepository.findManyByCompany(
      company.id,
      request.tenantId,
    );

    return {
      company,
      departments,
      departmentsCount: departments.length,
    };
  }
}
