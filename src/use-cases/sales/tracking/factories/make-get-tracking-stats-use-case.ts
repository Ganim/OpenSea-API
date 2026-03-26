import { PrismaProposalsRepository } from '@/repositories/sales/prisma/prisma-proposals-repository';
import { PrismaQuotesRepository } from '@/repositories/sales/prisma/prisma-quotes-repository';
import { GetTrackingStatsUseCase } from '../get-tracking-stats';

export function makeGetTrackingStatsUseCase() {
  const quotesRepository = new PrismaQuotesRepository();
  const proposalsRepository = new PrismaProposalsRepository();
  const getTrackingStatsUseCase = new GetTrackingStatsUseCase(
    quotesRepository,
    proposalsRepository,
  );
  return getTrackingStatsUseCase;
}
