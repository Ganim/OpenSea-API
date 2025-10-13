import { PrismaVariantsRepository } from '@/repositories/stock/prisma/prisma-variants-repository';
import { DeleteVariantUseCase } from '../delete-variant';

export function makeDeleteVariantUseCase() {
  const variantsRepository = new PrismaVariantsRepository();

  return new DeleteVariantUseCase(variantsRepository);
}
