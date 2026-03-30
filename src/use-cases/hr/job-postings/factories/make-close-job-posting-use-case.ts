import { PrismaJobPostingsRepository } from '@/repositories/hr/prisma/prisma-job-postings-repository';
import { CloseJobPostingUseCase } from '../close-job-posting';

export function makeCloseJobPostingUseCase() {
  const jobPostingsRepository = new PrismaJobPostingsRepository();
  return new CloseJobPostingUseCase(jobPostingsRepository);
}
