import { PrismaQuotesRepository } from '@/repositories/sales/prisma/prisma-quotes-repository';
import { DeleteQuoteUseCase } from '../delete-quote';

export function makeDeleteQuoteUseCase() {
  const quotesRepository = new PrismaQuotesRepository();
  const deleteQuoteUseCase = new DeleteQuoteUseCase(quotesRepository);
  return deleteQuoteUseCase;
}
