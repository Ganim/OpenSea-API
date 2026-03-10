import { PrismaProductCareInstructionsRepository } from '@/repositories/stock/prisma/prisma-product-care-instructions-repository';
import { PrismaProductsRepository } from '@/repositories/stock/prisma/prisma-products-repository';
import { PrismaTemplatesRepository } from '@/repositories/stock/prisma/prisma-templates-repository';
import { getCareCatalogProvider } from '@/services/care/care-catalog-provider';
import { CreateProductCareInstructionUseCase } from '../create-product-care-instruction';

export function makeCreateProductCareInstructionUseCase() {
  const productCareInstructionsRepository =
    new PrismaProductCareInstructionsRepository();
  const productsRepository = new PrismaProductsRepository();
  const templatesRepository = new PrismaTemplatesRepository();
  const careCatalogProvider = getCareCatalogProvider();

  return new CreateProductCareInstructionUseCase(
    productCareInstructionsRepository,
    productsRepository,
    templatesRepository,
    careCatalogProvider,
  );
}
