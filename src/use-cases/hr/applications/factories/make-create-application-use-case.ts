import { PrismaApplicationsRepository } from '@/repositories/hr/prisma/prisma-applications-repository';
import { PrismaCandidatesRepository } from '@/repositories/hr/prisma/prisma-candidates-repository';
import { PrismaJobPostingsRepository } from '@/repositories/hr/prisma/prisma-job-postings-repository';
import { CreateApplicationUseCase } from '../create-application';

export function makeCreateApplicationUseCase() {
  const applicationsRepository = new PrismaApplicationsRepository();
  const jobPostingsRepository = new PrismaJobPostingsRepository();
  const candidatesRepository = new PrismaCandidatesRepository();
  return new CreateApplicationUseCase(
    applicationsRepository,
    jobPostingsRepository,
    candidatesRepository,
  );
}
