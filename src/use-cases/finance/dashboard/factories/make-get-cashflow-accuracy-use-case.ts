import { PrismaCashflowSnapshotsRepository } from '@/repositories/finance/prisma/prisma-cashflow-snapshots-repository';
import { GetCashflowAccuracyUseCase } from '../get-cashflow-accuracy';

export function makeGetCashflowAccuracyUseCase() {
  const snapshotsRepository = new PrismaCashflowSnapshotsRepository();

  return new GetCashflowAccuracyUseCase(snapshotsRepository);
}
