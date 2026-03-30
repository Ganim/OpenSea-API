import { PrismaInterviewStagesRepository } from '@/repositories/hr/prisma/prisma-interview-stages-repository';
import { PrismaJobPostingsRepository } from '@/repositories/hr/prisma/prisma-job-postings-repository';
import { CreateInterviewStageUseCase } from '../create-interview-stage';

export function makeCreateInterviewStageUseCase() {
  const interviewStagesRepository = new PrismaInterviewStagesRepository();
  const jobPostingsRepository = new PrismaJobPostingsRepository();
  return new CreateInterviewStageUseCase(interviewStagesRepository, jobPostingsRepository);
}
