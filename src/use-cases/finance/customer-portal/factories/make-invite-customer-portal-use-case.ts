import { PrismaCustomerPortalAccessesRepository } from '@/repositories/finance/prisma/prisma-customer-portal-accesses-repository';
import { InviteCustomerPortalUseCase } from '../invite-customer-portal';

export function makeInviteCustomerPortalUseCase() {
  const repository = new PrismaCustomerPortalAccessesRepository();
  return new InviteCustomerPortalUseCase(repository);
}
