import { PrismaApprovalDelegationsRepository } from '@/repositories/hr/prisma/prisma-approval-delegations-repository';
import { RevokeDelegationUseCase } from '../revoke-delegation';

export function makeRevokeDelegationUseCase(): RevokeDelegationUseCase {
  const approvalDelegationsRepository =
    new PrismaApprovalDelegationsRepository();
  return new RevokeDelegationUseCase(approvalDelegationsRepository);
}
