import { PrismaCadenceSequencesRepository } from '@/repositories/sales/prisma/prisma-cadence-sequences-repository';
import { DeactivateCadenceSequenceUseCase } from '../deactivate-cadence-sequence';

export function makeDeactivateCadenceSequenceUseCase() {
  const cadenceSequencesRepository = new PrismaCadenceSequencesRepository();
  return new DeactivateCadenceSequenceUseCase(cadenceSequencesRepository);
}
