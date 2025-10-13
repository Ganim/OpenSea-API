import { PrismaProductsRepository } from '@/repositories/stock/prisma/prisma-products-repository';
import { PrismaTemplatesRepository } from '@/repositories/stock/prisma/prisma-templates-repository';
import { PrismaVariantsRepository } from '@/repositories/stock/prisma/prisma-variants-repository';
import { UpdateVariantUseCase } from '../update-variant';

export function makeUpdateVariantUseCase() {
  const variantsRepository = new PrismaVariantsRepository();
  const productsRepository = new PrismaProductsRepository();
  const templatesRepository = new PrismaTemplatesRepository();

  return new UpdateVariantUseCase(
    variantsRepository,
    productsRepository,
    templatesRepository,
  );
}
