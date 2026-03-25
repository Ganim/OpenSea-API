import { PrismaStoreCreditsRepository } from '@/repositories/sales/prisma/prisma-store-credits-repository';
import { DeleteStoreCreditUseCase } from '../delete-store-credit';

export function makeDeleteStoreCreditUseCase() {
  return new DeleteStoreCreditUseCase(new PrismaStoreCreditsRepository());
}
