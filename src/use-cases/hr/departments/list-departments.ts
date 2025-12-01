import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import { Department } from '@/entities/hr/department';
import { DepartmentsRepository } from '@/repositories/hr/departments-repository';

export interface ListDepartmentsRequest {
  page?: number;
  perPage?: number;
  search?: string;
  isActive?: boolean;
  parentId?: string;
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
    const { page = 1, perPage = 20, search, isActive, parentId } = request;

    const result = await this.departmentsRepository.findMany({
      page,
      perPage,
      search,
      isActive,
      parentId: parentId ? new UniqueEntityID(parentId) : undefined,
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
