import { PrismaTransactionManager } from '@/lib/transaction-manager';
import { PrismaPPEAssignmentsRepository } from '@/repositories/hr/prisma/prisma-ppe-assignments-repository';
import { PrismaPPEItemsRepository } from '@/repositories/hr/prisma/prisma-ppe-items-repository';
import { AssignPPEUseCase } from '../assign-ppe';

export function makeAssignPPEUseCase() {
  const ppeAssignmentsRepository = new PrismaPPEAssignmentsRepository();
  const ppeItemsRepository = new PrismaPPEItemsRepository();
  const transactionManager = new PrismaTransactionManager();
  return new AssignPPEUseCase(
    ppeAssignmentsRepository,
    ppeItemsRepository,
    transactionManager,
  );
}
