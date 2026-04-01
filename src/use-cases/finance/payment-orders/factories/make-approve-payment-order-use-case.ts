import { PrismaFinanceEntriesRepository } from '@/repositories/finance/prisma/prisma-finance-entries-repository';
import { PrismaPaymentOrdersRepository } from '@/repositories/finance/prisma/prisma-payment-orders-repository';
import { getBankingProviderForAccount } from '@/services/banking/get-banking-provider';
import { ApprovePaymentOrderUseCase } from '../approve-payment-order';
import { makeGeneratePaymentReceiptUseCase } from './make-generate-payment-receipt-use-case';

export function makeApprovePaymentOrderUseCase() {
  const paymentOrdersRepository = new PrismaPaymentOrdersRepository();
  const financeEntriesRepository = new PrismaFinanceEntriesRepository();
  const generatePaymentReceipt = makeGeneratePaymentReceiptUseCase();

  return new ApprovePaymentOrderUseCase(
    paymentOrdersRepository,
    financeEntriesRepository,
    (bankAccountId, _tenantId) => getBankingProviderForAccount(bankAccountId),
    generatePaymentReceipt,
  );
}
