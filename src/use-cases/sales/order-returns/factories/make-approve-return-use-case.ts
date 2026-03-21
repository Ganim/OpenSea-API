import { PrismaOrderReturnsRepository } from '@/repositories/sales/prisma/prisma-order-returns-repository';
import { ApproveReturnUseCase } from '../approve-return';

export function makeApproveReturnUseCase() {
  return new ApproveReturnUseCase(new PrismaOrderReturnsRepository());
}
