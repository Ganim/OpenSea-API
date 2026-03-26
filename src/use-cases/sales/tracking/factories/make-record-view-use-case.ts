import { PrismaProposalsRepository } from '@/repositories/sales/prisma/prisma-proposals-repository';
import { PrismaQuotesRepository } from '@/repositories/sales/prisma/prisma-quotes-repository';
import { RecordViewUseCase } from '../record-view';

export function makeRecordViewUseCase() {
  const quotesRepository = new PrismaQuotesRepository();
  const proposalsRepository = new PrismaProposalsRepository();
  const recordViewUseCase = new RecordViewUseCase(
    quotesRepository,
    proposalsRepository,
  );
  return recordViewUseCase;
}
