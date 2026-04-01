import { PrismaBankAccountsRepository } from '@/repositories/finance/prisma/prisma-bank-accounts-repository';
import { PrismaFinanceEntriesRepository } from '@/repositories/finance/prisma/prisma-finance-entries-repository';
import { PrismaPaymentOrdersRepository } from '@/repositories/finance/prisma/prisma-payment-orders-repository';
import { S3FileUploadService } from '@/services/storage/s3-file-upload-service';
import { GeneratePaymentReceiptUseCase } from '../generate-payment-receipt';

export function makeGeneratePaymentReceiptUseCase() {
  const paymentOrdersRepository = new PrismaPaymentOrdersRepository();
  const financeEntriesRepository = new PrismaFinanceEntriesRepository();
  const bankAccountsRepository = new PrismaBankAccountsRepository();
  const fileUploadService = S3FileUploadService.getInstance();

  return new GeneratePaymentReceiptUseCase(
    paymentOrdersRepository,
    financeEntriesRepository,
    bankAccountsRepository,
    fileUploadService,
  );
}
