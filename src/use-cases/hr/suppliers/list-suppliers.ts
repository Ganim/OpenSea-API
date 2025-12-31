import type { Supplier } from '@/entities/hr/organization/supplier';
import type { SuppliersRepository } from '@/repositories/hr/suppliers-repository';

interface ListSuppliersRequest {
  page?: number;
  perPage?: number;
  search?: string;
  includeDeleted?: boolean;
  status?: string;
}

interface ListSuppliersResponse {
  suppliers: Supplier[];
  total: number;
}

export class ListSuppliersUseCase {
  constructor(private suppliersRepository: SuppliersRepository) {}

  async execute(request: ListSuppliersRequest): Promise<ListSuppliersResponse> {
    const { organizations, total } = await this.suppliersRepository.findMany({
      page: request.page,
      perPage: request.perPage,
      search: request.search,
      includeDeleted: request.includeDeleted,
      status: request.status,
    });

    return {
      suppliers: organizations,
      total,
    };
  }
}
