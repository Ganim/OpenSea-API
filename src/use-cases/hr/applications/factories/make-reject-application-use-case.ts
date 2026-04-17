import { PrismaApplicationsRepository } from '@/repositories/hr/prisma/prisma-applications-repository';
import { PrismaCandidatesRepository } from '@/repositories/hr/prisma/prisma-candidates-repository';
import { AnonymizeCandidateUseCase } from '../../candidates/anonymize-candidate';
import { RejectApplicationUseCase } from '../reject-application';

export function makeRejectApplicationUseCase() {
  const applicationsRepository = new PrismaApplicationsRepository();
  const candidatesRepository = new PrismaCandidatesRepository();
  const anonymizeCandidateUseCase = new AnonymizeCandidateUseCase(
    candidatesRepository,
  );
  return new RejectApplicationUseCase(
    applicationsRepository,
    anonymizeCandidateUseCase,
  );
}
