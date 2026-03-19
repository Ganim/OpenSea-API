import { PrismaProductsRepository } from '@/repositories/stock/prisma/prisma-products-repository';
import { PrismaTemplatesRepository } from '@/repositories/stock/prisma/prisma-templates-repository';
import { PrismaVariantsRepository } from '@/repositories/stock/prisma/prisma-variants-repository';
import { BulkCreateVariantsUseCase } from '../bulk-create-variants';

export function makeBulkCreateVariantsUseCase() {
  const variantsRepository = new PrismaVariantsRepository();
  const productsRepository = new PrismaProductsRepository();
  const templatesRepository = new PrismaTemplatesRepository();

  return new BulkCreateVariantsUseCase(
    variantsRepository,
    productsRepository,
    templatesRepository,
  );
}
