import { PrismaDependantsRepository } from '@/repositories/hr/prisma/prisma-dependants-repository';
import { ListDependantsUseCase } from '../list-dependants';

export function makeListDependantsUseCase() {
  const dependantsRepository = new PrismaDependantsRepository();
  return new ListDependantsUseCase(dependantsRepository);
}
