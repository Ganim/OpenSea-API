import { PrismaCategoriesRepository } from '@/repositories/stock/prisma/prisma-categories-repository';
import { PrismaManufacturersRepository } from '@/repositories/stock/prisma/prisma-manufacturers-repository';
import { PrismaProductsRepository } from '@/repositories/stock/prisma/prisma-products-repository';
import { PrismaTemplatesRepository } from '@/repositories/stock/prisma/prisma-templates-repository';
import { ValidateBulkProductsUseCase } from '@/use-cases/stock/products/validate-bulk-products';

export function makeValidateBulkProductsUseCase() {
  const productsRepository = new PrismaProductsRepository();
  const categoriesRepository = new PrismaCategoriesRepository();
  const manufacturersRepository = new PrismaManufacturersRepository();
  const templatesRepository = new PrismaTemplatesRepository();

  return new ValidateBulkProductsUseCase(
    productsRepository,
    categoriesRepository,
    manufacturersRepository,
    templatesRepository,
  );
}
