import { PrismaJobPostingsRepository } from '@/repositories/hr/prisma/prisma-job-postings-repository';
import { DeleteJobPostingUseCase } from '../delete-job-posting';

export function makeDeleteJobPostingUseCase() {
  const jobPostingsRepository = new PrismaJobPostingsRepository();
  return new DeleteJobPostingUseCase(jobPostingsRepository);
}
