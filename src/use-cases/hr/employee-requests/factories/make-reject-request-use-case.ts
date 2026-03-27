import { PrismaEmployeeRequestsRepository } from '@/repositories/hr/prisma/prisma-employee-requests-repository';
import { RejectRequestUseCase } from '../reject-request';

export function makeRejectRequestUseCase(): RejectRequestUseCase {
  const employeeRequestsRepository = new PrismaEmployeeRequestsRepository();
  return new RejectRequestUseCase(employeeRequestsRepository);
}
