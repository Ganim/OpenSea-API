import { PrismaEmployeeRequestsRepository } from '@/repositories/hr/prisma/prisma-employee-requests-repository';
import { GetRequestUseCase } from '../get-request';

export function makeGetRequestUseCase(): GetRequestUseCase {
  const employeeRequestsRepository = new PrismaEmployeeRequestsRepository();
  return new GetRequestUseCase(employeeRequestsRepository);
}
