import { PrismaEmployeeRequestsRepository } from '@/repositories/hr/prisma/prisma-employee-requests-repository';
import { ApproveRequestUseCase } from '../approve-request';

export function makeApproveRequestUseCase(): ApproveRequestUseCase {
  const employeeRequestsRepository = new PrismaEmployeeRequestsRepository();
  return new ApproveRequestUseCase(employeeRequestsRepository);
}
