import { PrismaTenantPlansRepository } from '@/repositories/core/prisma/prisma-tenant-plans-repository';
import { PrismaTenantsRepository } from '@/repositories/core/prisma/prisma-tenants-repository';
import { GetTenantDetailsUseCase } from '../get-tenant-details';

export function makeGetTenantDetailsUseCase() {
  const tenantsRepository = new PrismaTenantsRepository();
  const tenantPlansRepository = new PrismaTenantPlansRepository();
  return new GetTenantDetailsUseCase(tenantsRepository, tenantPlansRepository);
}
