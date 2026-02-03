import { PrismaTenantsRepository } from '@/repositories/core/prisma/prisma-tenants-repository';
import { UpdateTenantAdminUseCase } from '../update-tenant-admin';

export function makeUpdateTenantAdminUseCase() {
  const tenantsRepository = new PrismaTenantsRepository();
  return new UpdateTenantAdminUseCase(tenantsRepository);
}
