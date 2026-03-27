import { PrismaReconciliationSuggestionsRepository } from '@/repositories/finance/prisma/prisma-reconciliation-suggestions-repository';
import { RejectReconciliationSuggestionUseCase } from '../reject-reconciliation-suggestion';

export function makeRejectReconciliationSuggestionUseCase() {
  const suggestionsRepository = new PrismaReconciliationSuggestionsRepository();
  return new RejectReconciliationSuggestionUseCase(suggestionsRepository);
}
