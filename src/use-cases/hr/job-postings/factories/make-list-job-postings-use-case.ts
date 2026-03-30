import { PrismaJobPostingsRepository } from '@/repositories/hr/prisma/prisma-job-postings-repository';
import { ListJobPostingsUseCase } from '../list-job-postings';

export function makeListJobPostingsUseCase() {
  const jobPostingsRepository = new PrismaJobPostingsRepository();
  return new ListJobPostingsUseCase(jobPostingsRepository);
}
