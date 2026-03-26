import { PrismaFinanceEntryRetentionsRepository } from '@/repositories/finance/prisma/prisma-finance-entry-retentions-repository';
import { ListEntryRetentionsUseCase } from '../list-entry-retentions';

export function makeListEntryRetentionsUseCase() {
  const retentionsRepository = new PrismaFinanceEntryRetentionsRepository();

  return new ListEntryRetentionsUseCase(retentionsRepository);
}
