import { PrismaDependantsRepository } from '@/repositories/hr/prisma/prisma-dependants-repository';
import { DeleteDependantUseCase } from '../delete-dependant';

export function makeDeleteDependantUseCase() {
  const dependantsRepository = new PrismaDependantsRepository();
  return new DeleteDependantUseCase(dependantsRepository);
}
