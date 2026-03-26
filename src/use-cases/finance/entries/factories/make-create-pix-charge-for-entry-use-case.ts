import { PrismaPixChargesRepository } from '@/repositories/cashier/prisma/prisma-pix-charges-repository';
import { PrismaFinanceEntriesRepository } from '@/repositories/finance/prisma/prisma-finance-entries-repository';
import { getPixProvider } from '@/services/cashier/pix-provider-factory';
import { CreatePixChargeForEntryUseCase } from '../create-pix-charge-for-entry';

export function makeCreatePixChargeForEntryUseCase() {
  const financeEntriesRepository = new PrismaFinanceEntriesRepository();
  const pixChargesRepository = new PrismaPixChargesRepository();
  const pixProvider = getPixProvider();

  return new CreatePixChargeForEntryUseCase(
    financeEntriesRepository,
    pixChargesRepository,
    pixProvider,
  );
}
