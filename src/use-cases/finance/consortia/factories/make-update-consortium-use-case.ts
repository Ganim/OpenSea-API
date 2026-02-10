import { PrismaConsortiaRepository } from '@/repositories/finance/prisma/prisma-consortia-repository';
import { UpdateConsortiumUseCase } from '../update-consortium';

export function makeUpdateConsortiumUseCase() {
  const consortiaRepository = new PrismaConsortiaRepository();
  return new UpdateConsortiumUseCase(consortiaRepository);
}
