import { PrismaBinsRepository } from '@/repositories/stock/prisma/prisma-bins-repository';
import { PrismaItemMovementsRepository } from '@/repositories/stock/prisma/prisma-item-movements-repository';
import { PrismaItemsRepository } from '@/repositories/stock/prisma/prisma-items-repository';
import { PrismaProductsRepository } from '@/repositories/stock/prisma/prisma-products-repository';
import { PrismaTemplatesRepository } from '@/repositories/stock/prisma/prisma-templates-repository';
import { PrismaVariantsRepository } from '@/repositories/stock/prisma/prisma-variants-repository';
import { RegisterItemEntryUseCase } from '../register-item-entry';

export function makeRegisterItemEntryUseCase() {
  const itemsRepository = new PrismaItemsRepository();
  const variantsRepository = new PrismaVariantsRepository();
  const binsRepository = new PrismaBinsRepository();
  const itemMovementsRepository = new PrismaItemMovementsRepository();
  const productsRepository = new PrismaProductsRepository();
  const templatesRepository = new PrismaTemplatesRepository();

  return new RegisterItemEntryUseCase(
    itemsRepository,
    variantsRepository,
    binsRepository,
    itemMovementsRepository,
    productsRepository,
    templatesRepository,
  );
}
