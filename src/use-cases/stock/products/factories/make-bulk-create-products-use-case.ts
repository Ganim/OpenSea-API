import { PrismaCategoriesRepository } from '@/repositories/stock/prisma/prisma-categories-repository';
import { PrismaManufacturersRepository } from '@/repositories/stock/prisma/prisma-manufacturers-repository';
import { PrismaProductsRepository } from '@/repositories/stock/prisma/prisma-products-repository';
import { PrismaTemplatesRepository } from '@/repositories/stock/prisma/prisma-templates-repository';
import { BulkCreateProductsUseCase } from '@/use-cases/stock/products/bulk-create-products';

export function makeBulkCreateProductsUseCase() {
  const productsRepository = new PrismaProductsRepository();
  const templatesRepository = new PrismaTemplatesRepository();
  const manufacturersRepository = new PrismaManufacturersRepository();
  const categoriesRepository = new PrismaCategoriesRepository();

  return new BulkCreateProductsUseCase(
    productsRepository,
    templatesRepository,
    manufacturersRepository,
    categoriesRepository,
  );
}
