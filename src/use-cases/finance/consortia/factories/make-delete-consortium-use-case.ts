import { PrismaConsortiaRepository } from '@/repositories/finance/prisma/prisma-consortia-repository';
import { DeleteConsortiumUseCase } from '../delete-consortium';

export function makeDeleteConsortiumUseCase() {
  const consortiaRepository = new PrismaConsortiaRepository();
  return new DeleteConsortiumUseCase(consortiaRepository);
}
