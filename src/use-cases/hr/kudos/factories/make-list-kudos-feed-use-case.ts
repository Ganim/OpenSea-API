import { PrismaEmployeeKudosRepository } from '@/repositories/hr/prisma/prisma-employee-kudos-repository';
import { ListKudosFeedUseCase } from '../list-kudos-feed';

export function makeListKudosFeedUseCase(): ListKudosFeedUseCase {
  const employeeKudosRepository = new PrismaEmployeeKudosRepository();
  return new ListKudosFeedUseCase(employeeKudosRepository);
}
