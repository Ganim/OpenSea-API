import { PrismaInterviewsRepository } from '@/repositories/hr/prisma/prisma-interviews-repository';
import { GetInterviewUseCase } from '../get-interview';

export function makeGetInterviewUseCase() {
  const interviewsRepository = new PrismaInterviewsRepository();
  return new GetInterviewUseCase(interviewsRepository);
}
