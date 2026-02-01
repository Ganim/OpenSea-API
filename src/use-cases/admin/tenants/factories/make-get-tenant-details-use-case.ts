import { PrismaTenantsRepository } from '@/repositories/core/prisma/prisma-tenants-repository';
import { GetTenantDetailsUseCase } from '../get-tenant-details';

export function makeGetTenantDetailsUseCase() {
  const tenantsRepository = new PrismaTenantsRepository();
  return new GetTenantDetailsUseCase(tenantsRepository);
}
