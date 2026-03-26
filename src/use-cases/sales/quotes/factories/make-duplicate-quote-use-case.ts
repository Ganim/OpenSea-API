import { PrismaQuotesRepository } from '@/repositories/sales/prisma/prisma-quotes-repository';
import { DuplicateQuoteUseCase } from '../duplicate-quote';

export function makeDuplicateQuoteUseCase() {
  const quotesRepository = new PrismaQuotesRepository();
  const duplicateQuoteUseCase = new DuplicateQuoteUseCase(quotesRepository);
  return duplicateQuoteUseCase;
}
