import { PrismaInterviewStagesRepository } from '@/repositories/hr/prisma/prisma-interview-stages-repository';
import { DeleteInterviewStageUseCase } from '../delete-interview-stage';

export function makeDeleteInterviewStageUseCase() {
  const interviewStagesRepository = new PrismaInterviewStagesRepository();
  return new DeleteInterviewStageUseCase(interviewStagesRepository);
}
