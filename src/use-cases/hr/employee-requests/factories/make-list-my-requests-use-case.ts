import { PrismaEmployeeRequestsRepository } from '@/repositories/hr/prisma/prisma-employee-requests-repository';
import { ListMyRequestsUseCase } from '../list-my-requests';

export function makeListMyRequestsUseCase(): ListMyRequestsUseCase {
  const employeeRequestsRepository = new PrismaEmployeeRequestsRepository();
  return new ListMyRequestsUseCase(employeeRequestsRepository);
}
