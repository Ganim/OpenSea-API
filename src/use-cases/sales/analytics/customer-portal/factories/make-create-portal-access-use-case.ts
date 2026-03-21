import { PrismaCustomerPortalAccessesRepository } from '@/repositories/sales/prisma/prisma-customer-portal-accesses-repository';
import { CreatePortalAccessUseCase } from '../create-portal-access';

export function makeCreatePortalAccessUseCase() {
  const portalAccessesRepository = new PrismaCustomerPortalAccessesRepository();
  return new CreatePortalAccessUseCase(portalAccessesRepository);
}
