import { PrismaProductsRepository } from '@/repositories/stock/prisma/prisma-products-repository';
import { PrismaTemplatesRepository } from '@/repositories/stock/prisma/prisma-templates-repository';
import { PrismaVariantsRepository } from '@/repositories/stock/prisma/prisma-variants-repository';
import { CreateVariantUseCase } from '../create-variant';

export function makeCreateVariantUseCase() {
  const variantsRepository = new PrismaVariantsRepository();
  const productsRepository = new PrismaProductsRepository();
  const templatesRepository = new PrismaTemplatesRepository();

  return new CreateVariantUseCase(
    variantsRepository,
    productsRepository,
    templatesRepository,
  );
}
