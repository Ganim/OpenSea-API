import { PrismaBankReconciliationsRepository } from '@/repositories/finance/prisma/prisma-bank-reconciliations-repository';
import { IgnoreReconciliationItemUseCase } from '../ignore-reconciliation-item';

export function makeIgnoreReconciliationItemUseCase() {
  const reconciliationsRepository = new PrismaBankReconciliationsRepository();
  return new IgnoreReconciliationItemUseCase(reconciliationsRepository);
}
