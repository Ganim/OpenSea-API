import { PrismaTransactionManager } from '@/lib/transaction-manager';
import { PrismaItemsRepository } from '@/repositories/stock/prisma/prisma-items-repository';
import { PrismaProductsRepository } from '@/repositories/stock/prisma/prisma-products-repository';
import { PrismaVariantsRepository } from '@/repositories/stock/prisma/prisma-variants-repository';
import { DeleteProductUseCase } from '@/use-cases/stock/products/delete-product';

export function makeDeleteProductUseCase() {
  const productsRepository = new PrismaProductsRepository();
  const variantsRepository = new PrismaVariantsRepository();
  const itemsRepository = new PrismaItemsRepository();
  const transactionManager = new PrismaTransactionManager();
  return new DeleteProductUseCase(
    productsRepository,
    variantsRepository,
    itemsRepository,
    transactionManager,
  );
}
