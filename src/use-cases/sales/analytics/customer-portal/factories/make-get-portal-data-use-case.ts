import { PrismaCustomerPortalAccessesRepository } from '@/repositories/sales/prisma/prisma-customer-portal-accesses-repository';
import { GetPortalDataUseCase } from '../get-portal-data';

export function makeGetPortalDataUseCase() {
  const portalAccessesRepository = new PrismaCustomerPortalAccessesRepository();
  return new GetPortalDataUseCase(portalAccessesRepository);
}
