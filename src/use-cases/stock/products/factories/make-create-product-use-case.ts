import { PrismaCategoriesRepository } from '@/repositories/stock/prisma/prisma-categories-repository';
import { PrismaManufacturersRepository } from '@/repositories/stock/prisma/prisma-manufacturers-repository';
import { PrismaProductsRepository } from '@/repositories/stock/prisma/prisma-products-repository';
import { PrismaSuppliersRepository } from '@/repositories/stock/prisma/prisma-suppliers-repository';
import { PrismaTemplatesRepository } from '@/repositories/stock/prisma/prisma-templates-repository';
import { getCareCatalogProvider } from '@/services/care';
import { CreateProductUseCase } from '@/use-cases/stock/products/create-product';

export function makeCreateProductUseCase() {
  const productsRepository = new PrismaProductsRepository();
  const templatesRepository = new PrismaTemplatesRepository();
  const suppliersRepository = new PrismaSuppliersRepository();
  const manufacturersRepository = new PrismaManufacturersRepository();
  const categoriesRepository = new PrismaCategoriesRepository();
  const careCatalogProvider = getCareCatalogProvider();

  return new CreateProductUseCase(
    productsRepository,
    templatesRepository,
    suppliersRepository,
    manufacturersRepository,
    categoriesRepository,
    careCatalogProvider,
  );
}
