import { PrismaCustomerPortalAccessesRepository } from '@/repositories/finance/prisma/prisma-customer-portal-accesses-repository';
import { ValidatePortalTokenUseCase } from '../validate-portal-token';

export function makeValidatePortalTokenUseCase() {
  const repository = new PrismaCustomerPortalAccessesRepository();
  return new ValidatePortalTokenUseCase(repository);
}
