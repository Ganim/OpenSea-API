import { PrismaEmployeeKudosRepository } from '@/repositories/hr/prisma/prisma-employee-kudos-repository';
import { PinKudosUseCase } from '../pin-kudos';

export function makePinKudosUseCase(): PinKudosUseCase {
  return new PinKudosUseCase(new PrismaEmployeeKudosRepository());
}
