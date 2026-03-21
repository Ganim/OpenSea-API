import { PrismaOrdersRepository } from '@/repositories/sales/prisma/prisma-orders-repository';
import { ConvertQuoteUseCase } from '../convert-quote';

export function makeConvertQuoteUseCase() {
  return new ConvertQuoteUseCase(new PrismaOrdersRepository());
}
