import { PrismaCandidatesRepository } from '@/repositories/hr/prisma/prisma-candidates-repository';
import { DeleteCandidateUseCase } from '../delete-candidate';

export function makeDeleteCandidateUseCase() {
  const candidatesRepository = new PrismaCandidatesRepository();
  return new DeleteCandidateUseCase(candidatesRepository);
}
