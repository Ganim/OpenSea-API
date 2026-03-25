import { makeCreateFinanceEntryUseCase } from './make-create-finance-entry-use-case';
import { CreateFinanceEntriesBatchUseCase } from '../create-finance-entries-batch';

export function makeCreateFinanceEntriesBatchUseCase() {
  const createFinanceEntryUseCase = makeCreateFinanceEntryUseCase();

  return new CreateFinanceEntriesBatchUseCase(createFinanceEntryUseCase);
}
