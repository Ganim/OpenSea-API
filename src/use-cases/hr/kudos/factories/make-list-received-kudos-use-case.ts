import { PrismaEmployeeKudosRepository } from '@/repositories/hr/prisma/prisma-employee-kudos-repository';
import { ListReceivedKudosUseCase } from '../list-received-kudos';

export function makeListReceivedKudosUseCase(): ListReceivedKudosUseCase {
  const employeeKudosRepository = new PrismaEmployeeKudosRepository();
  return new ListReceivedKudosUseCase(employeeKudosRepository);
}
