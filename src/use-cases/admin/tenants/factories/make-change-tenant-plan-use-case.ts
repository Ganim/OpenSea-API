import { PrismaPlansRepository } from '@/repositories/core/prisma/prisma-plans-repository';
import { PrismaTenantPlansRepository } from '@/repositories/core/prisma/prisma-tenant-plans-repository';
import { PrismaTenantsRepository } from '@/repositories/core/prisma/prisma-tenants-repository';
import { ChangeTenantPlanUseCase } from '../change-tenant-plan';

export function makeChangeTenantPlanUseCase() {
  const tenantsRepository = new PrismaTenantsRepository();
  const plansRepository = new PrismaPlansRepository();
  const tenantPlansRepository = new PrismaTenantPlansRepository();
  return new ChangeTenantPlanUseCase(
    tenantsRepository,
    plansRepository,
    tenantPlansRepository,
  );
}
