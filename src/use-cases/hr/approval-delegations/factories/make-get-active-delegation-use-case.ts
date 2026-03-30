import { PrismaApprovalDelegationsRepository } from '@/repositories/hr/prisma/prisma-approval-delegations-repository';
import { GetActiveDelegationUseCase } from '../get-active-delegation';

export function makeGetActiveDelegationUseCase(): GetActiveDelegationUseCase {
  const approvalDelegationsRepository =
    new PrismaApprovalDelegationsRepository();
  return new GetActiveDelegationUseCase(approvalDelegationsRepository);
}
