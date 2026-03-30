import { PrismaJobPostingsRepository } from '@/repositories/hr/prisma/prisma-job-postings-repository';
import { GetJobPostingUseCase } from '../get-job-posting';

export function makeGetJobPostingUseCase() {
  const jobPostingsRepository = new PrismaJobPostingsRepository();
  return new GetJobPostingUseCase(jobPostingsRepository);
}
