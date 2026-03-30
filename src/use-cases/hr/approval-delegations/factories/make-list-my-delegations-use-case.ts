import { PrismaApprovalDelegationsRepository } from '@/repositories/hr/prisma/prisma-approval-delegations-repository';
import { ListMyDelegationsUseCase } from '../list-my-delegations';

export function makeListMyDelegationsUseCase(): ListMyDelegationsUseCase {
  const approvalDelegationsRepository =
    new PrismaApprovalDelegationsRepository();
  return new ListMyDelegationsUseCase(approvalDelegationsRepository);
}
