import { PrismaPurchaseOrdersRepository } from '@/repositories/stock/prisma/prisma-purchase-orders-repository';
import { PrismaSuppliersRepository } from '@/repositories/stock/prisma/prisma-suppliers-repository';
import { PrismaVariantsRepository } from '@/repositories/stock/prisma/prisma-variants-repository';
import { CreatePurchaseOrderUseCase } from '../create-purchase-order';

export function makeCreatePurchaseOrderUseCase() {
  const purchaseOrdersRepository = new PrismaPurchaseOrdersRepository();
  const suppliersRepository = new PrismaSuppliersRepository();
  const variantsRepository = new PrismaVariantsRepository();

  return new CreatePurchaseOrderUseCase(
    purchaseOrdersRepository,
    suppliersRepository,
    variantsRepository,
  );
}
