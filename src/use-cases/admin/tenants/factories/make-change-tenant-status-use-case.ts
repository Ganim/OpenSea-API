import { PrismaTenantsRepository } from '@/repositories/core/prisma/prisma-tenants-repository';
import { ChangeTenantStatusUseCase } from '../change-tenant-status';

export function makeChangeTenantStatusUseCase() {
  const tenantsRepository = new PrismaTenantsRepository();
  return new ChangeTenantStatusUseCase(tenantsRepository);
}
