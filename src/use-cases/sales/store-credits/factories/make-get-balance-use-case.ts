import { PrismaStoreCreditsRepository } from '@/repositories/sales/prisma/prisma-store-credits-repository';
import { GetBalanceUseCase } from '../get-balance';

export function makeGetBalanceUseCase() {
  return new GetBalanceUseCase(new PrismaStoreCreditsRepository());
}
