import { PrismaConsortiaRepository } from '@/repositories/finance/prisma/prisma-consortia-repository';
import { ListConsortiaUseCase } from '../list-consortia';

export function makeListConsortiaUseCase() {
  const consortiaRepository = new PrismaConsortiaRepository();
  return new ListConsortiaUseCase(consortiaRepository);
}
