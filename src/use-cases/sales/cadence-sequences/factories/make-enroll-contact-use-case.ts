import { PrismaCadenceSequencesRepository } from '@/repositories/sales/prisma/prisma-cadence-sequences-repository';
import { EnrollContactUseCase } from '../enroll-contact';

export function makeEnrollContactUseCase() {
  const cadenceSequencesRepository = new PrismaCadenceSequencesRepository();
  return new EnrollContactUseCase(cadenceSequencesRepository);
}
