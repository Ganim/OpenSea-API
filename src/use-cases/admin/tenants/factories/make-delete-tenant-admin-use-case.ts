import { PrismaTenantsRepository } from '@/repositories/core/prisma/prisma-tenants-repository';
import { DeleteTenantAdminUseCase } from '../delete-tenant-admin';

export function makeDeleteTenantAdminUseCase() {
  const tenantsRepository = new PrismaTenantsRepository();
  return new DeleteTenantAdminUseCase(tenantsRepository);
}
