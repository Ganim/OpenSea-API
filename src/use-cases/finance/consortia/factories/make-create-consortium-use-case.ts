import { PrismaConsortiaRepository } from '@/repositories/finance/prisma/prisma-consortia-repository';
import { PrismaConsortiumPaymentsRepository } from '@/repositories/finance/prisma/prisma-consortium-payments-repository';
import { PrismaBankAccountsRepository } from '@/repositories/finance/prisma/prisma-bank-accounts-repository';
import { PrismaCostCentersRepository } from '@/repositories/finance/prisma/prisma-cost-centers-repository';
import { CreateConsortiumUseCase } from '../create-consortium';

export function makeCreateConsortiumUseCase() {
  const consortiaRepository = new PrismaConsortiaRepository();
  const paymentsRepository = new PrismaConsortiumPaymentsRepository();
  const bankAccountsRepository = new PrismaBankAccountsRepository();
  const costCentersRepository = new PrismaCostCentersRepository();

  return new CreateConsortiumUseCase(
    consortiaRepository,
    paymentsRepository,
    bankAccountsRepository,
    costCentersRepository,
  );
}
