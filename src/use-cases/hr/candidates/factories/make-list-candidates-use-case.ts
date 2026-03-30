import { PrismaCandidatesRepository } from '@/repositories/hr/prisma/prisma-candidates-repository';
import { ListCandidatesUseCase } from '../list-candidates';

export function makeListCandidatesUseCase() {
  const candidatesRepository = new PrismaCandidatesRepository();
  return new ListCandidatesUseCase(candidatesRepository);
}
