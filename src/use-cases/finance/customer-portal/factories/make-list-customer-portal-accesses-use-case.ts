import { PrismaCustomerPortalAccessesRepository } from '@/repositories/finance/prisma/prisma-customer-portal-accesses-repository';
import { ListCustomerPortalAccessesUseCase } from '../list-customer-portal-accesses';

export function makeListCustomerPortalAccessesUseCase() {
  const repository = new PrismaCustomerPortalAccessesRepository();
  return new ListCustomerPortalAccessesUseCase(repository);
}
