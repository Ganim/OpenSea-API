import { PrismaCandidatesRepository } from '@/repositories/hr/prisma/prisma-candidates-repository';
import { AnonymizeCandidateUseCase } from '../anonymize-candidate';
import { DeleteCandidateUseCase } from '../delete-candidate';

export function makeDeleteCandidateUseCase() {
  const candidatesRepository = new PrismaCandidatesRepository();
  const anonymizeCandidateUseCase = new AnonymizeCandidateUseCase(
    candidatesRepository,
  );
  return new DeleteCandidateUseCase(
    candidatesRepository,
    anonymizeCandidateUseCase,
  );
}
