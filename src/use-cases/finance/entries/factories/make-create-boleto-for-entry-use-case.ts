import { PrismaFinanceEntriesRepository } from '@/repositories/finance/prisma/prisma-finance-entries-repository';
import { EfiBoletoProvider } from '@/services/cashier/efi-boleto.provider';
import { CreateBoletoForEntryUseCase } from '../create-boleto-for-entry';

export function makeCreateBoletoForEntryUseCase() {
  const entriesRepository = new PrismaFinanceEntriesRepository();
  const efiBoletoProvider = new EfiBoletoProvider();

  return new CreateBoletoForEntryUseCase(entriesRepository, efiBoletoProvider);
}
