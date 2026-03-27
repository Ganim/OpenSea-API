import { PrismaAuthLinksRepository } from '@/repositories/core/prisma/prisma-auth-links-repository';
import { PrismaTenantAuthConfigRepository } from '@/repositories/core/prisma/prisma-tenant-auth-config-repository';
import { UpdateTenantAuthConfigUseCase } from '../update-tenant-auth-config';

export function makeUpdateTenantAuthConfigUseCase() {
  const tenantAuthConfigRepository = new PrismaTenantAuthConfigRepository();
  const authLinksRepository = new PrismaAuthLinksRepository();

  return new UpdateTenantAuthConfigUseCase(
    tenantAuthConfigRepository,
    authLinksRepository,
  );
}
