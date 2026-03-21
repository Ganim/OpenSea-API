import { PrismaTenantBrandsRepository } from '@/repositories/sales/prisma/prisma-tenant-brands-repository';
import { UpdateTenantBrandUseCase } from '../update-tenant-brand';

export function makeUpdateTenantBrandUseCase() {
  const tenantBrandsRepository = new PrismaTenantBrandsRepository();
  return new UpdateTenantBrandUseCase(tenantBrandsRepository);
}
