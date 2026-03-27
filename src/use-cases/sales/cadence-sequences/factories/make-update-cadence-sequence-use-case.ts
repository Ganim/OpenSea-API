import { PrismaCadenceSequencesRepository } from '@/repositories/sales/prisma/prisma-cadence-sequences-repository';
import { UpdateCadenceSequenceUseCase } from '../update-cadence-sequence';

export function makeUpdateCadenceSequenceUseCase() {
  const cadenceSequencesRepository = new PrismaCadenceSequencesRepository();
  return new UpdateCadenceSequenceUseCase(cadenceSequencesRepository);
}
