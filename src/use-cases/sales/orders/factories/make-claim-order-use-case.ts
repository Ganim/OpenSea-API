import { PrismaOrdersRepository } from '@/repositories/sales/prisma/prisma-orders-repository';
import { ClaimOrderUseCase } from '../claim-order';

export function makeClaimOrderUseCase() {
  return new ClaimOrderUseCase(new PrismaOrdersRepository());
}
