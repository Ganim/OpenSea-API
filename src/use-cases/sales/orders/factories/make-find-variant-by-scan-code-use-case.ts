import { PrismaVariantsRepository } from '@/repositories/stock/prisma/prisma-variants-repository';
import { FindVariantByScanCodeUseCase } from '../find-variant-by-scan-code';

export function makeFindVariantByScanCodeUseCase() {
  return new FindVariantByScanCodeUseCase(new PrismaVariantsRepository());
}
