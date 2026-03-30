import { PrismaInterviewsRepository } from '@/repositories/hr/prisma/prisma-interviews-repository';
import { CompleteInterviewUseCase } from '../complete-interview';

export function makeCompleteInterviewUseCase() {
  const interviewsRepository = new PrismaInterviewsRepository();
  return new CompleteInterviewUseCase(interviewsRepository);
}
