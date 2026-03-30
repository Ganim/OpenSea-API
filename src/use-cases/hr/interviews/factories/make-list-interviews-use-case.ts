import { PrismaInterviewsRepository } from '@/repositories/hr/prisma/prisma-interviews-repository';
import { ListInterviewsUseCase } from '../list-interviews';

export function makeListInterviewsUseCase() {
  const interviewsRepository = new PrismaInterviewsRepository();
  return new ListInterviewsUseCase(interviewsRepository);
}
