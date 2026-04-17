import { PrismaTransactionManager } from '@/lib/transaction-manager';
import { PrismaApplicationsRepository } from '@/repositories/hr/prisma/prisma-applications-repository';
import { PrismaCandidatesRepository } from '@/repositories/hr/prisma/prisma-candidates-repository';
import { PrismaEmployeesRepository } from '@/repositories/hr/prisma/prisma-employees-repository';
import { PrismaJobPostingsRepository } from '@/repositories/hr/prisma/prisma-job-postings-repository';
import { HireApplicationUseCase } from '../hire-application';

export function makeHireApplicationUseCase() {
  const applicationsRepository = new PrismaApplicationsRepository();
  const candidatesRepository = new PrismaCandidatesRepository();
  const employeesRepository = new PrismaEmployeesRepository();
  const jobPostingsRepository = new PrismaJobPostingsRepository();
  const transactionManager = new PrismaTransactionManager();

  return new HireApplicationUseCase(
    applicationsRepository,
    candidatesRepository,
    employeesRepository,
    jobPostingsRepository,
    transactionManager,
  );
}
