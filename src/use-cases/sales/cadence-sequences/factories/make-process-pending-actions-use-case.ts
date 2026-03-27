import { PrismaCadenceSequencesRepository } from '@/repositories/sales/prisma/prisma-cadence-sequences-repository';
import { ProcessPendingActionsUseCase } from '../process-pending-actions';

export function makeProcessPendingActionsUseCase() {
  const cadenceSequencesRepository = new PrismaCadenceSequencesRepository();
  return new ProcessPendingActionsUseCase(cadenceSequencesRepository);
}
