import { PrismaTenantAuthConfigRepository } from '@/repositories/core/prisma/prisma-tenant-auth-config-repository';
import { GetTenantAuthConfigUseCase } from '../get-tenant-auth-config';

export function makeGetTenantAuthConfigUseCase() {
  const tenantAuthConfigRepository = new PrismaTenantAuthConfigRepository();

  return new GetTenantAuthConfigUseCase(tenantAuthConfigRepository);
}
