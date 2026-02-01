import {
  type TenantDTO,
  tenantToDTO,
} from '@/mappers/core/tenant/tenant-to-dto';
import type { TenantsRepository } from '@/repositories/core/tenants-repository';

interface ListAllTenantsUseCaseRequest {
  page: number;
  perPage: number;
}

interface ListAllTenantsUseCaseResponse {
  tenants: TenantDTO[];
  meta: {
    total: number;
    page: number;
    perPage: number;
    totalPages: number;
  };
}

export class ListAllTenantsUseCase {
  constructor(private tenantsRepository: TenantsRepository) {}

  async execute({
    page,
    perPage,
  }: ListAllTenantsUseCaseRequest): Promise<ListAllTenantsUseCaseResponse> {
    const [allTenants, totalTenants] = await Promise.all([
      this.tenantsRepository.findMany(page, perPage),
      this.tenantsRepository.countAll(),
    ]);

    const totalPages = Math.ceil(totalTenants / perPage);

    return {
      tenants: allTenants.map(tenantToDTO),
      meta: {
        total: totalTenants,
        page,
        perPage,
        totalPages,
      },
    };
  }
}
