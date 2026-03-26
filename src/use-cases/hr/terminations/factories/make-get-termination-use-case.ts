import { PrismaTerminationsRepository } from '@/repositories/hr/prisma/prisma-terminations-repository';
import { GetTerminationUseCase } from '../get-termination';

export function makeGetTerminationUseCase() {
  const terminationsRepository = new PrismaTerminationsRepository();
  return new GetTerminationUseCase(terminationsRepository);
}
