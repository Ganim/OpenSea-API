import { PrismaCustomerPortalAccessesRepository } from '@/repositories/finance/prisma/prisma-customer-portal-accesses-repository';
import { RevokeCustomerPortalAccessUseCase } from '../revoke-customer-portal-access';

export function makeRevokeCustomerPortalAccessUseCase() {
  const repository = new PrismaCustomerPortalAccessesRepository();
  return new RevokeCustomerPortalAccessUseCase(repository);
}
