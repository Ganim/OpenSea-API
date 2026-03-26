import { PrismaDependantsRepository } from '@/repositories/hr/prisma/prisma-dependants-repository';
import { GetDependantUseCase } from '../get-dependant';

export function makeGetDependantUseCase() {
  const dependantsRepository = new PrismaDependantsRepository();
  return new GetDependantUseCase(dependantsRepository);
}
