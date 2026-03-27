import { PrismaCadenceSequencesRepository } from '@/repositories/sales/prisma/prisma-cadence-sequences-repository';
import { ActivateCadenceSequenceUseCase } from '../activate-cadence-sequence';

export function makeActivateCadenceSequenceUseCase() {
  const cadenceSequencesRepository = new PrismaCadenceSequencesRepository();
  return new ActivateCadenceSequenceUseCase(cadenceSequencesRepository);
}
