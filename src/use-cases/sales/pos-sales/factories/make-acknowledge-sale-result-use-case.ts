import { PrismaOrdersRepository } from '@/repositories/sales/prisma/prisma-orders-repository';
import { AcknowledgeSaleResultUseCase } from '../acknowledge-sale-result';

export function makeAcknowledgeSaleResultUseCase(): AcknowledgeSaleResultUseCase {
  return new AcknowledgeSaleResultUseCase(new PrismaOrdersRepository());
}
