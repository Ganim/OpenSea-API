import { PrismaProductCareInstructionsRepository } from '@/repositories/stock/prisma/prisma-product-care-instructions-repository';
import { DeleteProductCareInstructionUseCase } from '../delete-product-care-instruction';

export function makeDeleteProductCareInstructionUseCase() {
  const productCareInstructionsRepository =
    new PrismaProductCareInstructionsRepository();

  return new DeleteProductCareInstructionUseCase(
    productCareInstructionsRepository,
  );
}
