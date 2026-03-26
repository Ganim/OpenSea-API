import { PrismaQuotesRepository } from '@/repositories/sales/prisma/prisma-quotes-repository';
import { UpdateQuoteUseCase } from '../update-quote';

export function makeUpdateQuoteUseCase() {
  const quotesRepository = new PrismaQuotesRepository();
  const updateQuoteUseCase = new UpdateQuoteUseCase(quotesRepository);
  return updateQuoteUseCase;
}
