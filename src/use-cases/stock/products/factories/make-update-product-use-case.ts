import { PrismaManufacturersRepository } from '@/repositories/stock/prisma/prisma-manufacturers-repository';
import { PrismaProductsRepository } from '@/repositories/stock/prisma/prisma-products-repository';
import { PrismaSuppliersRepository } from '@/repositories/stock/prisma/prisma-suppliers-repository';
import { PrismaTemplatesRepository } from '@/repositories/stock/prisma/prisma-templates-repository';
import { UpdateProductUseCase } from '@/use-cases/stock/products/update-product';

export function makeUpdateProductUseCase() {
  const productsRepository = new PrismaProductsRepository();
  const templatesRepository = new PrismaTemplatesRepository();
  const suppliersRepository = new PrismaSuppliersRepository();
  const manufacturersRepository = new PrismaManufacturersRepository();

  return new UpdateProductUseCase(
    productsRepository,
    templatesRepository,
    suppliersRepository,
    manufacturersRepository,
  );
}
