import { PrismaEmployeeKudosRepository } from '@/repositories/hr/prisma/prisma-employee-kudos-repository';
import { ListSentKudosUseCase } from '../list-sent-kudos';

export function makeListSentKudosUseCase(): ListSentKudosUseCase {
  const employeeKudosRepository = new PrismaEmployeeKudosRepository();
  return new ListSentKudosUseCase(employeeKudosRepository);
}
