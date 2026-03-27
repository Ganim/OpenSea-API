import { PrismaCadenceSequencesRepository } from '@/repositories/sales/prisma/prisma-cadence-sequences-repository';
import { DeleteCadenceSequenceUseCase } from '../delete-cadence-sequence';

export function makeDeleteCadenceSequenceUseCase() {
  const cadenceSequencesRepository = new PrismaCadenceSequencesRepository();
  return new DeleteCadenceSequenceUseCase(cadenceSequencesRepository);
}
