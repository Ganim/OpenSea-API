import { PrismaCandidatesRepository } from '@/repositories/hr/prisma/prisma-candidates-repository';
import { UpdateCandidateUseCase } from '../update-candidate';

export function makeUpdateCandidateUseCase() {
  const candidatesRepository = new PrismaCandidatesRepository();
  return new UpdateCandidateUseCase(candidatesRepository);
}
