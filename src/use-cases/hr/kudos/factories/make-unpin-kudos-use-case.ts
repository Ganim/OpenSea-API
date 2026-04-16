import { PrismaEmployeeKudosRepository } from '@/repositories/hr/prisma/prisma-employee-kudos-repository';
import { UnpinKudosUseCase } from '../unpin-kudos';

export function makeUnpinKudosUseCase(): UnpinKudosUseCase {
  return new UnpinKudosUseCase(new PrismaEmployeeKudosRepository());
}
