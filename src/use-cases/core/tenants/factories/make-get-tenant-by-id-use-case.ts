import { PrismaTenantsRepository } from '@/repositories/core/prisma/prisma-tenants-repository';
import { GetTenantByIdUseCase } from '../get-tenant-by-id';

export function makeGetTenantByIdUseCase() {
  const tenantsRepository = new PrismaTenantsRepository();
  return new GetTenantByIdUseCase(tenantsRepository);
}
