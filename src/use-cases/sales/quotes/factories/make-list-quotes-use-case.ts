import { PrismaQuotesRepository } from '@/repositories/sales/prisma/prisma-quotes-repository';
import { ListQuotesUseCase } from '../list-quotes';

export function makeListQuotesUseCase() {
  const quotesRepository = new PrismaQuotesRepository();
  const listQuotesUseCase = new ListQuotesUseCase(quotesRepository);
  return listQuotesUseCase;
}
