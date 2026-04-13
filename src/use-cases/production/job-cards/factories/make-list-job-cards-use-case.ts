import { PrismaJobCardsRepository } from '@/repositories/production/prisma/prisma-job-cards-repository';
import { ListJobCardsUseCase } from '../list-job-cards';

export function makeListJobCardsUseCase() {
  const jobCardsRepository = new PrismaJobCardsRepository();
  const listJobCardsUseCase = new ListJobCardsUseCase(jobCardsRepository);
  return listJobCardsUseCase;
}
