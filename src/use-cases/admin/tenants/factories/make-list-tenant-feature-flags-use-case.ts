import { PrismaTenantFeatureFlagsRepository } from '@/repositories/core/prisma/prisma-tenant-feature-flags-repository';
import { PrismaTenantsRepository } from '@/repositories/core/prisma/prisma-tenants-repository';
import { ListTenantFeatureFlagsUseCase } from '../list-tenant-feature-flags';

export function makeListTenantFeatureFlagsUseCase() {
  const tenantsRepository = new PrismaTenantsRepository();
  const tenantFeatureFlagsRepository = new PrismaTenantFeatureFlagsRepository();
  return new ListTenantFeatureFlagsUseCase(
    tenantsRepository,
    tenantFeatureFlagsRepository,
  );
}
