import { PrismaBankReconciliationsRepository } from '@/repositories/finance/prisma/prisma-bank-reconciliations-repository';
import { CancelReconciliationUseCase } from '../cancel-reconciliation';

export function makeCancelReconciliationUseCase() {
  const reconciliationsRepository = new PrismaBankReconciliationsRepository();
  return new CancelReconciliationUseCase(reconciliationsRepository);
}
