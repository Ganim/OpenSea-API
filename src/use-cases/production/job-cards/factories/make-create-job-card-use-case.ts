import { PrismaJobCardsRepository } from '@/repositories/production/prisma/prisma-job-cards-repository';
import { CreateJobCardUseCase } from '../create-job-card';

export function makeCreateJobCardUseCase() {
  const jobCardsRepository = new PrismaJobCardsRepository();
  const createJobCardUseCase = new CreateJobCardUseCase(jobCardsRepository);
  return createJobCardUseCase;
}
