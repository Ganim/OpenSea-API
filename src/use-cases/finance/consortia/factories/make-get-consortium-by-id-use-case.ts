import { PrismaConsortiaRepository } from '@/repositories/finance/prisma/prisma-consortia-repository';
import { PrismaConsortiumPaymentsRepository } from '@/repositories/finance/prisma/prisma-consortium-payments-repository';
import { GetConsortiumByIdUseCase } from '../get-consortium-by-id';

export function makeGetConsortiumByIdUseCase() {
  const consortiaRepository = new PrismaConsortiaRepository();
  const paymentsRepository = new PrismaConsortiumPaymentsRepository();
  return new GetConsortiumByIdUseCase(consortiaRepository, paymentsRepository);
}
