import { PrismaFormsRepository } from '@/repositories/sales/prisma/prisma-forms-repository';
import { ListFormsUseCase } from '../list-forms';

export function makeListFormsUseCase() {
  return new ListFormsUseCase(new PrismaFormsRepository());
}
