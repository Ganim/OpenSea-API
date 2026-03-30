import { PrismaJobPostingsRepository } from '@/repositories/hr/prisma/prisma-job-postings-repository';
import { UpdateJobPostingUseCase } from '../update-job-posting';

export function makeUpdateJobPostingUseCase() {
  const jobPostingsRepository = new PrismaJobPostingsRepository();
  return new UpdateJobPostingUseCase(jobPostingsRepository);
}
