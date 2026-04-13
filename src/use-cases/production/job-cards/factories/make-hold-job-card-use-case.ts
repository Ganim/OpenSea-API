import { PrismaJobCardsRepository } from '@/repositories/production/prisma/prisma-job-cards-repository';
import { HoldJobCardUseCase } from '../hold-job-card';

export function makeHoldJobCardUseCase() {
  const jobCardsRepository = new PrismaJobCardsRepository();
  const holdJobCardUseCase = new HoldJobCardUseCase(jobCardsRepository);
  return holdJobCardUseCase;
}
