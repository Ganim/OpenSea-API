import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import { Department } from '@/entities/hr/department';
import { DepartmentsRepository } from '@/repositories/hr/departments-repository';

export interface ListDepartmentsRequest {
  tenantId: string;
  page?: number;
  perPage?: number;
  search?: string;
  isActive?: boolean;
  parentId?: string;
  companyId?: string;
}

export interface ListDepartmentsResponse {
  departments: Department[];
  meta: {
    total: number;
    page: number;
    perPage: number;
    totalPages: number;
  };
}

export class ListDepartmentsUseCase {
  constructor(private departmentsRepository: DepartmentsRepository) {}

  async execute(
    request: ListDepartmentsRequest,
  ): Promise<ListDepartmentsResponse> {
    const {
      tenantId,
      page = 1,
      perPage = 20,
      search,
      isActive,
      parentId,
      companyId,
    } = request;

    const result = await this.departmentsRepository.findMany({
      tenantId,
      page,
      perPage,
      search,
      isActive,
      parentId: parentId ? new UniqueEntityID(parentId) : undefined,
      companyId: companyId ? new UniqueEntityID(companyId) : undefined,
    });

    const totalPages = Math.ceil(result.total / perPage);

    return {
      departments: result.departments,
      meta: {
        total: result.total,
        page,
        perPage,
        totalPages,
      },
    };
  }
}
