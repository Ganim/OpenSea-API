import { PrismaCadenceSequencesRepository } from '@/repositories/sales/prisma/prisma-cadence-sequences-repository';
import { AdvanceStepUseCase } from '../advance-step';

export function makeAdvanceStepUseCase() {
  const cadenceSequencesRepository = new PrismaCadenceSequencesRepository();
  return new AdvanceStepUseCase(cadenceSequencesRepository);
}
