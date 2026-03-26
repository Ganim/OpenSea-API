import { PrismaQuotesRepository } from '@/repositories/sales/prisma/prisma-quotes-repository';
import { ConvertQuoteToOrderUseCase } from '../convert-quote-to-order';

export function makeConvertQuoteToOrderUseCase() {
  const quotesRepository = new PrismaQuotesRepository();
  const convertQuoteToOrderUseCase = new ConvertQuoteToOrderUseCase(
    quotesRepository,
  );
  return convertQuoteToOrderUseCase;
}
