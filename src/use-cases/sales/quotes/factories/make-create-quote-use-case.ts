import { PrismaQuotesRepository } from '@/repositories/sales/prisma/prisma-quotes-repository';
import { CreateQuoteUseCase } from '../create-quote';

export function makeCreateQuoteUseCase() {
  const quotesRepository = new PrismaQuotesRepository();
  const createQuoteUseCase = new CreateQuoteUseCase(quotesRepository);
  return createQuoteUseCase;
}
