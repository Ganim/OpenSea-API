import { PrismaJobCardsRepository } from '@/repositories/production/prisma/prisma-job-cards-repository';
import { StartJobCardUseCase } from '../start-job-card';

export function makeStartJobCardUseCase() {
  const jobCardsRepository = new PrismaJobCardsRepository();
  const startJobCardUseCase = new StartJobCardUseCase(jobCardsRepository);
  return startJobCardUseCase;
}
