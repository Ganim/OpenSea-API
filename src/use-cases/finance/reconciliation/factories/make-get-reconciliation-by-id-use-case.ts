import { PrismaBankReconciliationsRepository } from '@/repositories/finance/prisma/prisma-bank-reconciliations-repository';
import { GetReconciliationByIdUseCase } from '../get-reconciliation-by-id';

export function makeGetReconciliationByIdUseCase() {
  const reconciliationsRepository = new PrismaBankReconciliationsRepository();
  return new GetReconciliationByIdUseCase(reconciliationsRepository);
}
