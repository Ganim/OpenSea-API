import { PrismaJobCardsRepository } from '@/repositories/production/prisma/prisma-job-cards-repository';
import { CompleteJobCardUseCase } from '../complete-job-card';

export function makeCompleteJobCardUseCase() {
  const jobCardsRepository = new PrismaJobCardsRepository();
  const completeJobCardUseCase = new CompleteJobCardUseCase(jobCardsRepository);
  return completeJobCardUseCase;
}
