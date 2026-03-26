import { PrismaTerminationsRepository } from '@/repositories/hr/prisma/prisma-terminations-repository';
import { UpdateTerminationUseCase } from '../update-termination';

export function makeUpdateTerminationUseCase() {
  const terminationsRepository = new PrismaTerminationsRepository();
  return new UpdateTerminationUseCase(terminationsRepository);
}
