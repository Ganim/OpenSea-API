import { PrismaProductsRepository } from '@/repositories/stock/prisma/prisma-products-repository';
import { PrismaTemplatesRepository } from '@/repositories/stock/prisma/prisma-templates-repository';
import { ValidateBulkVariantsUseCase } from '../validate-bulk-variants';

export function makeValidateBulkVariantsUseCase() {
  const productsRepository = new PrismaProductsRepository();
  const templatesRepository = new PrismaTemplatesRepository();

  return new ValidateBulkVariantsUseCase(
    productsRepository,
    templatesRepository,
  );
}
