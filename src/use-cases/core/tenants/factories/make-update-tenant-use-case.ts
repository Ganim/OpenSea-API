import { PrismaTenantsRepository } from '@/repositories/core/prisma/prisma-tenants-repository';
import { UpdateTenantUseCase } from '../update-tenant';

export function makeUpdateTenantUseCase() {
  const tenantsRepository = new PrismaTenantsRepository();
  return new UpdateTenantUseCase(tenantsRepository);
}
