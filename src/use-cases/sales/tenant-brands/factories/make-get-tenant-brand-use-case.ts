import { PrismaTenantBrandsRepository } from '@/repositories/sales/prisma/prisma-tenant-brands-repository';
import { GetTenantBrandUseCase } from '../get-tenant-brand';

export function makeGetTenantBrandUseCase() {
  const tenantBrandsRepository = new PrismaTenantBrandsRepository();
  return new GetTenantBrandUseCase(tenantBrandsRepository);
}
