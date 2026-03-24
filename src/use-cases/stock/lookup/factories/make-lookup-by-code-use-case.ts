import { PrismaBinsRepository } from '@/repositories/stock/prisma/prisma-bins-repository';
import { PrismaItemsRepository } from '@/repositories/stock/prisma/prisma-items-repository';
import { PrismaManufacturersRepository } from '@/repositories/stock/prisma/prisma-manufacturers-repository';
import { PrismaProductsRepository } from '@/repositories/stock/prisma/prisma-products-repository';
import { PrismaTemplatesRepository } from '@/repositories/stock/prisma/prisma-templates-repository';
import { PrismaVariantsRepository } from '@/repositories/stock/prisma/prisma-variants-repository';
import { LookupByCodeUseCase } from '../lookup-by-code';

export function makeLookupByCodeUseCase() {
  const itemsRepository = new PrismaItemsRepository();
  const variantsRepository = new PrismaVariantsRepository();
  const productsRepository = new PrismaProductsRepository();
  const binsRepository = new PrismaBinsRepository();
  const templatesRepository = new PrismaTemplatesRepository();
  const manufacturersRepository = new PrismaManufacturersRepository();

  return new LookupByCodeUseCase(
    itemsRepository,
    variantsRepository,
    productsRepository,
    binsRepository,
    templatesRepository,
    manufacturersRepository,
  );
}
