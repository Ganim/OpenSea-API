import { PrismaCandidatesRepository } from '@/repositories/hr/prisma/prisma-candidates-repository';
import { GetCandidateUseCase } from '../get-candidate';

export function makeGetCandidateUseCase() {
  const candidatesRepository = new PrismaCandidatesRepository();
  return new GetCandidateUseCase(candidatesRepository);
}
