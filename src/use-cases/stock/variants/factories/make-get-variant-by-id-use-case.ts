import { PrismaVariantsRepository } from '@/repositories/stock/prisma/prisma-variants-repository';
import { GetVariantByIdUseCase } from '../get-variant-by-id';

export function makeGetVariantByIdUseCase() {
  const variantsRepository = new PrismaVariantsRepository();

  return new GetVariantByIdUseCase(variantsRepository);
}
