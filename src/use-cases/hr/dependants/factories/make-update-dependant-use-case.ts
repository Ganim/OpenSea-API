import { PrismaDependantsRepository } from '@/repositories/hr/prisma/prisma-dependants-repository';
import { UpdateDependantUseCase } from '../update-dependant';

export function makeUpdateDependantUseCase() {
  const dependantsRepository = new PrismaDependantsRepository();
  return new UpdateDependantUseCase(dependantsRepository);
}
