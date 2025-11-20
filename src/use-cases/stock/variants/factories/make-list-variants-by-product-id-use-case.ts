import { PrismaVariantsRepository } from '@/repositories/stock/prisma/prisma-variants-repository';
import { ListVariantsByProductIdUseCase } from '../list-variants-by-product-id';

export function makeListVariantsByProductIdUseCase() {
  const variantsRepository = new PrismaVariantsRepository();

  return new ListVariantsByProductIdUseCase(variantsRepository);
}
