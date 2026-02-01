import { PrismaTenantFeatureFlagsRepository } from '@/repositories/core/prisma/prisma-tenant-feature-flags-repository';
import { PrismaTenantsRepository } from '@/repositories/core/prisma/prisma-tenants-repository';
import { ManageTenantFeatureFlagsUseCase } from '../manage-tenant-feature-flags';

export function makeManageTenantFeatureFlagsUseCase() {
  const tenantsRepository = new PrismaTenantsRepository();
  const tenantFeatureFlagsRepository = new PrismaTenantFeatureFlagsRepository();
  return new ManageTenantFeatureFlagsUseCase(
    tenantsRepository,
    tenantFeatureFlagsRepository,
  );
}
