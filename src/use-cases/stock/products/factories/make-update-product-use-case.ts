import { PrismaCategoriesRepository } from '@/repositories/stock/prisma/prisma-categories-repository';
import { PrismaManufacturersRepository } from '@/repositories/stock/prisma/prisma-manufacturers-repository';
import { PrismaProductsRepository } from '@/repositories/stock/prisma/prisma-products-repository';
import { PrismaTemplatesRepository } from '@/repositories/stock/prisma/prisma-templates-repository';
import { UpdateProductUseCase } from '@/use-cases/stock/products/update-product';

export function makeUpdateProductUseCase() {
  const productsRepository = new PrismaProductsRepository();
  const templatesRepository = new PrismaTemplatesRepository();
  const manufacturersRepository = new PrismaManufacturersRepository();
  const categoriesRepository = new PrismaCategoriesRepository();

  return new UpdateProductUseCase(
    productsRepository,
    templatesRepository,
    manufacturersRepository,
    categoriesRepository,
  );
}
