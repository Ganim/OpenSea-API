import { PrismaProductCareInstructionsRepository } from '@/repositories/stock/prisma/prisma-product-care-instructions-repository';
import { ListProductCareInstructionsUseCase } from '../list-product-care-instructions';

export function makeListProductCareInstructionsUseCase() {
  const productCareInstructionsRepository =
    new PrismaProductCareInstructionsRepository();

  return new ListProductCareInstructionsUseCase(
    productCareInstructionsRepository,
  );
}
