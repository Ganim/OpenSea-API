import { PrismaReconciliationSuggestionsRepository } from '@/repositories/finance/prisma/prisma-reconciliation-suggestions-repository';
import { ListReconciliationSuggestionsUseCase } from '../list-reconciliation-suggestions';

export function makeListReconciliationSuggestionsUseCase() {
  const suggestionsRepository = new PrismaReconciliationSuggestionsRepository();
  return new ListReconciliationSuggestionsUseCase(suggestionsRepository);
}
