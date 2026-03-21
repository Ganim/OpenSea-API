import { PrismaCustomersRepository } from '@/repositories/sales/prisma/prisma-customers-repository';
import { PrismaStoreCreditsRepository } from '@/repositories/sales/prisma/prisma-store-credits-repository';
import { CreateManualCreditUseCase } from '../create-manual-credit';

export function makeCreateManualCreditUseCase() {
  return new CreateManualCreditUseCase(
    new PrismaStoreCreditsRepository(),
    new PrismaCustomersRepository(),
  );
}
