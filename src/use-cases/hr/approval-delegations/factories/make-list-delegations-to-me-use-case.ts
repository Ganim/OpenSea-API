import { PrismaApprovalDelegationsRepository } from '@/repositories/hr/prisma/prisma-approval-delegations-repository';
import { ListDelegationsToMeUseCase } from '../list-delegations-to-me';

export function makeListDelegationsToMeUseCase(): ListDelegationsToMeUseCase {
  const approvalDelegationsRepository =
    new PrismaApprovalDelegationsRepository();
  return new ListDelegationsToMeUseCase(approvalDelegationsRepository);
}
