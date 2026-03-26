import { PrismaQuotesRepository } from '@/repositories/sales/prisma/prisma-quotes-repository';
import { GetQuoteByIdUseCase } from '../get-quote-by-id';

export function makeGetQuoteByIdUseCase() {
  const quotesRepository = new PrismaQuotesRepository();
  const getQuoteByIdUseCase = new GetQuoteByIdUseCase(quotesRepository);
  return getQuoteByIdUseCase;
}
