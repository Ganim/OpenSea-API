import { PrismaBankReconciliationsRepository } from '@/repositories/finance/prisma/prisma-bank-reconciliations-repository';
import { ListReconciliationsUseCase } from '../list-reconciliations';

export function makeListReconciliationsUseCase() {
  const reconciliationsRepository = new PrismaBankReconciliationsRepository();
  return new ListReconciliationsUseCase(reconciliationsRepository);
}
