import { PrismaInterviewsRepository } from '@/repositories/hr/prisma/prisma-interviews-repository';
import { CancelInterviewUseCase } from '../cancel-interview';

export function makeCancelInterviewUseCase() {
  const interviewsRepository = new PrismaInterviewsRepository();
  return new CancelInterviewUseCase(interviewsRepository);
}
