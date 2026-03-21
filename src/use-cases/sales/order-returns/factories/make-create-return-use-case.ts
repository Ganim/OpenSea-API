import { PrismaOrderReturnsRepository } from '@/repositories/sales/prisma/prisma-order-returns-repository';
import { PrismaOrdersRepository } from '@/repositories/sales/prisma/prisma-orders-repository';
import { CreateReturnUseCase } from '../create-return';

export function makeCreateReturnUseCase() {
  return new CreateReturnUseCase(
    new PrismaOrderReturnsRepository(),
    new PrismaOrdersRepository(),
  );
}
