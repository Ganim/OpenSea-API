import type { Manufacturer } from '@/entities/hr/organization/manufacturer';
import type { ManufacturersRepository } from '@/repositories/hr/manufacturers-repository';

interface ListManufacturersRequest {
  tenantId: string;
  page?: number;
  perPage?: number;
  search?: string;
  includeDeleted?: boolean;
  status?: string;
}

interface ListManufacturersResponse {
  manufacturers: Manufacturer[];
  total: number;
}

export class ListManufacturersUseCase {
  constructor(private manufacturersRepository: ManufacturersRepository) {}

  async execute(
    request: ListManufacturersRequest,
  ): Promise<ListManufacturersResponse> {
    const { organizations, total } =
      await this.manufacturersRepository.findMany({
        tenantId: request.tenantId,
        page: request.page,
        perPage: request.perPage,
        search: request.search,
        includeDeleted: request.includeDeleted,
        status: request.status,
      });

    return {
      manufacturers: organizations,
      total,
    };
  }
}
