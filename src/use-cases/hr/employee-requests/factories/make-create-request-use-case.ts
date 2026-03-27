import { PrismaEmployeeRequestsRepository } from '@/repositories/hr/prisma/prisma-employee-requests-repository';
import { CreateRequestUseCase } from '../create-request';

export function makeCreateRequestUseCase(): CreateRequestUseCase {
  const employeeRequestsRepository = new PrismaEmployeeRequestsRepository();
  return new CreateRequestUseCase(employeeRequestsRepository);
}
