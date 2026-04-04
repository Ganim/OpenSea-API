import { PrismaOrdersRepository } from '@/repositories/sales/prisma/prisma-orders-repository';
import { GetMyDraftsUseCase } from '../get-my-drafts';

export function makeGetMyDraftsUseCase() {
  return new GetMyDraftsUseCase(new PrismaOrdersRepository());
}
