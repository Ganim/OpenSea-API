import { PrismaAccountantAccessesRepository } from '@/repositories/finance/prisma/prisma-accountant-accesses-repository';
import { ListAccountantAccessesUseCase } from '../list-accountant-accesses';

export function makeListAccountantAccessesUseCase() {
  const repository = new PrismaAccountantAccessesRepository();
  return new ListAccountantAccessesUseCase(repository);
}
