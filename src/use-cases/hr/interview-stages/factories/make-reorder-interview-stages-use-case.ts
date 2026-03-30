import { PrismaInterviewStagesRepository } from '@/repositories/hr/prisma/prisma-interview-stages-repository';
import { PrismaJobPostingsRepository } from '@/repositories/hr/prisma/prisma-job-postings-repository';
import { ReorderInterviewStagesUseCase } from '../reorder-interview-stages';

export function makeReorderInterviewStagesUseCase() {
  const interviewStagesRepository = new PrismaInterviewStagesRepository();
  const jobPostingsRepository = new PrismaJobPostingsRepository();
  return new ReorderInterviewStagesUseCase(interviewStagesRepository, jobPostingsRepository);
}
