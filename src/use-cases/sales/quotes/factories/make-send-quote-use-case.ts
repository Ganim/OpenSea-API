import { PrismaQuotesRepository } from '@/repositories/sales/prisma/prisma-quotes-repository';
import { SendQuoteUseCase } from '../send-quote';

export function makeSendQuoteUseCase() {
  const quotesRepository = new PrismaQuotesRepository();
  const sendQuoteUseCase = new SendQuoteUseCase(quotesRepository);
  return sendQuoteUseCase;
}
