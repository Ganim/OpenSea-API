import { PrismaInterviewStagesRepository } from '@/repositories/hr/prisma/prisma-interview-stages-repository';
import { ListInterviewStagesUseCase } from '../list-interview-stages';

export function makeListInterviewStagesUseCase() {
  const interviewStagesRepository = new PrismaInterviewStagesRepository();
  return new ListInterviewStagesUseCase(interviewStagesRepository);
}
