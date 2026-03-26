import { PrismaTerminationsRepository } from '@/repositories/hr/prisma/prisma-terminations-repository';
import { ListTerminationsUseCase } from '../list-terminations';

export function makeListTerminationsUseCase() {
  const terminationsRepository = new PrismaTerminationsRepository();
  return new ListTerminationsUseCase(terminationsRepository);
}
