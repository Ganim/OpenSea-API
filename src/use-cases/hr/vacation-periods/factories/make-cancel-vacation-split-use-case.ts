import { PrismaVacationSplitsRepository } from '@/repositories/hr/prisma/prisma-vacation-splits-repository';
import { CancelVacationSplitUseCase } from '../cancel-vacation-split';

export function makeCancelVacationSplitUseCase(): CancelVacationSplitUseCase {
  const vacationSplitsRepository = new PrismaVacationSplitsRepository();

  return new CancelVacationSplitUseCase(vacationSplitsRepository);
}
