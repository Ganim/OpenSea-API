import { PrismaStoreCreditsRepository } from '@/repositories/sales/prisma/prisma-store-credits-repository';
import { GetStoreCreditByIdUseCase } from '../get-store-credit-by-id';

export function makeGetStoreCreditByIdUseCase() {
  return new GetStoreCreditByIdUseCase(new PrismaStoreCreditsRepository());
}
