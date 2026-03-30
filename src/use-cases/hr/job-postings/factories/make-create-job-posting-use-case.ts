import { PrismaJobPostingsRepository } from '@/repositories/hr/prisma/prisma-job-postings-repository';
import { CreateJobPostingUseCase } from '../create-job-posting';

export function makeCreateJobPostingUseCase() {
  const jobPostingsRepository = new PrismaJobPostingsRepository();
  return new CreateJobPostingUseCase(jobPostingsRepository);
}
