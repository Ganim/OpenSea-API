import { PrismaConsortiaRepository } from '@/repositories/finance/prisma/prisma-consortia-repository';
import { MarkContemplatedUseCase } from '../mark-contemplated';

export function makeMarkContemplatedUseCase() {
  const consortiaRepository = new PrismaConsortiaRepository();
  return new MarkContemplatedUseCase(consortiaRepository);
}
