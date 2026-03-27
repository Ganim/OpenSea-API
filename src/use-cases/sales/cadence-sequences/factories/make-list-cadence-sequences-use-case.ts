import { PrismaCadenceSequencesRepository } from '@/repositories/sales/prisma/prisma-cadence-sequences-repository';
import { ListCadenceSequencesUseCase } from '../list-cadence-sequences';

export function makeListCadenceSequencesUseCase() {
  const cadenceSequencesRepository = new PrismaCadenceSequencesRepository();
  return new ListCadenceSequencesUseCase(cadenceSequencesRepository);
}
