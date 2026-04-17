import { PrismaCandidatesRepository } from '@/repositories/hr/prisma/prisma-candidates-repository';
import { AnonymizeCandidateUseCase } from '../anonymize-candidate';

export function makeAnonymizeCandidateUseCase() {
  const candidatesRepository = new PrismaCandidatesRepository();
  return new AnonymizeCandidateUseCase(candidatesRepository);
}
