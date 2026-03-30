import { PrismaCandidatesRepository } from '@/repositories/hr/prisma/prisma-candidates-repository';
import { CreateCandidateUseCase } from '../create-candidate';

export function makeCreateCandidateUseCase() {
  const candidatesRepository = new PrismaCandidatesRepository();
  return new CreateCandidateUseCase(candidatesRepository);
}
