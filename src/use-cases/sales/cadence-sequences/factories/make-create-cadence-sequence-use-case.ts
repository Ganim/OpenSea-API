import { PrismaCadenceSequencesRepository } from '@/repositories/sales/prisma/prisma-cadence-sequences-repository';
import { CreateCadenceSequenceUseCase } from '../create-cadence-sequence';

export function makeCreateCadenceSequenceUseCase() {
  const cadenceSequencesRepository = new PrismaCadenceSequencesRepository();
  return new CreateCadenceSequenceUseCase(cadenceSequencesRepository);
}
