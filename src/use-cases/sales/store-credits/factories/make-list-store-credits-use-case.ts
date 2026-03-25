import { PrismaStoreCreditsRepository } from '@/repositories/sales/prisma/prisma-store-credits-repository';
import { ListStoreCreditsUseCase } from '../list-store-credits';

export function makeListStoreCreditsUseCase() {
  return new ListStoreCreditsUseCase(new PrismaStoreCreditsRepository());
}
