import { PrismaProductsRepository } from '@/repositories/stock/prisma/prisma-products-repository';
import { getCareCatalogProvider } from '@/services/care';
import { SetProductCareInstructionsUseCase } from '../set-product-care-instructions';

export function makeSetProductCareInstructionsUseCase() {
  const productsRepository = new PrismaProductsRepository();
  const careCatalogProvider = getCareCatalogProvider();
  return new SetProductCareInstructionsUseCase(
    productsRepository,
    careCatalogProvider,
  );
}
