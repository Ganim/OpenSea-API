import { PrismaTenantUsersRepository } from '@/repositories/core/prisma/prisma-tenant-users-repository';
import { RemoveUserFromTenantUseCase } from '../remove-user-from-tenant';

export function makeRemoveUserFromTenantUseCase() {
  const tenantUsersRepository = new PrismaTenantUsersRepository();
  return new RemoveUserFromTenantUseCase(tenantUsersRepository);
}
