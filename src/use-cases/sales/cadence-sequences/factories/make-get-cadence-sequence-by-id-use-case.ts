import { PrismaCadenceSequencesRepository } from '@/repositories/sales/prisma/prisma-cadence-sequences-repository';
import { GetCadenceSequenceByIdUseCase } from '../get-cadence-sequence-by-id';

export function makeGetCadenceSequenceByIdUseCase() {
  const cadenceSequencesRepository = new PrismaCadenceSequencesRepository();
  return new GetCadenceSequenceByIdUseCase(cadenceSequencesRepository);
}
