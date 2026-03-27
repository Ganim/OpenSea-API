import { PrismaEmployeeRequestsRepository } from '@/repositories/hr/prisma/prisma-employee-requests-repository';
import { ListPendingApprovalsUseCase } from '../list-pending-approvals';

export function makeListPendingApprovalsUseCase(): ListPendingApprovalsUseCase {
  const employeeRequestsRepository = new PrismaEmployeeRequestsRepository();
  return new ListPendingApprovalsUseCase(employeeRequestsRepository);
}
