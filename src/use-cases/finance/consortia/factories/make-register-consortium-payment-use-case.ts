import { PrismaConsortiaRepository } from '@/repositories/finance/prisma/prisma-consortia-repository';
import { PrismaConsortiumPaymentsRepository } from '@/repositories/finance/prisma/prisma-consortium-payments-repository';
import { RegisterConsortiumPaymentUseCase } from '../register-consortium-payment';

export function makeRegisterConsortiumPaymentUseCase() {
  const consortiaRepository = new PrismaConsortiaRepository();
  const paymentsRepository = new PrismaConsortiumPaymentsRepository();
  return new RegisterConsortiumPaymentUseCase(
    consortiaRepository,
    paymentsRepository,
  );
}
