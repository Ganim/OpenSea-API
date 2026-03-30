import { PrismaFinanceEntriesRepository } from '@/repositories/finance/prisma/prisma-finance-entries-repository';
import { ProcessCnabReturnUseCase } from '../process-cnab-return';

export function makeProcessCnabReturnUseCase() {
  const financeEntriesRepository = new PrismaFinanceEntriesRepository();
  return new ProcessCnabReturnUseCase(financeEntriesRepository);
}
