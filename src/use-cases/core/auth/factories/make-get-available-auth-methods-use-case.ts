import { PrismaTenantAuthConfigRepository } from '@/repositories/core/prisma/prisma-tenant-auth-config-repository';
import { GetAvailableAuthMethodsUseCase } from '../get-available-auth-methods';

export function makeGetAvailableAuthMethodsUseCase() {
  const tenantAuthConfigRepository = new PrismaTenantAuthConfigRepository();

  return new GetAvailableAuthMethodsUseCase(tenantAuthConfigRepository);
}
