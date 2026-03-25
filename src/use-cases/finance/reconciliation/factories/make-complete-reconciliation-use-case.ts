import { PrismaBankReconciliationsRepository } from '@/repositories/finance/prisma/prisma-bank-reconciliations-repository';
import { CompleteReconciliationUseCase } from '../complete-reconciliation';

export function makeCompleteReconciliationUseCase() {
  const reconciliationsRepository = new PrismaBankReconciliationsRepository();
  return new CompleteReconciliationUseCase(reconciliationsRepository);
}
