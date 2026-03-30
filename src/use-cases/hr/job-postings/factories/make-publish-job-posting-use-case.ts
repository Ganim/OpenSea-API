import { PrismaJobPostingsRepository } from '@/repositories/hr/prisma/prisma-job-postings-repository';
import { PublishJobPostingUseCase } from '../publish-job-posting';

export function makePublishJobPostingUseCase() {
  const jobPostingsRepository = new PrismaJobPostingsRepository();
  return new PublishJobPostingUseCase(jobPostingsRepository);
}
