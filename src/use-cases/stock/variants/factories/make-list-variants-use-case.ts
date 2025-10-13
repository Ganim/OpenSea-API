import { PrismaVariantsRepository } from '@/repositories/stock/prisma/prisma-variants-repository';
import { ListVariantsUseCase } from '../list-variants';

export function makeListVariantsUseCase() {
  const variantsRepository = new PrismaVariantsRepository();

  return new ListVariantsUseCase(variantsRepository);
}
