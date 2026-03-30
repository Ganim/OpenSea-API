import { PrismaApprovalDelegationsRepository } from '@/repositories/hr/prisma/prisma-approval-delegations-repository';
import { PrismaEmployeesRepository } from '@/repositories/hr/prisma/prisma-employees-repository';
import { CreateDelegationUseCase } from '../create-delegation';

export function makeCreateDelegationUseCase(): CreateDelegationUseCase {
  const approvalDelegationsRepository =
    new PrismaApprovalDelegationsRepository();
  const employeesRepository = new PrismaEmployeesRepository();
  return new CreateDelegationUseCase(
    approvalDelegationsRepository,
    employeesRepository,
  );
}
