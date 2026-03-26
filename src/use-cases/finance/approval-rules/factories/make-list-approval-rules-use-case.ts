import { PrismaFinanceApprovalRulesRepository } from '@/repositories/finance/prisma/prisma-finance-approval-rules-repository';
import { ListApprovalRulesUseCase } from '../list-approval-rules';

export function makeListApprovalRulesUseCase() {
  const repository = new PrismaFinanceApprovalRulesRepository();
  return new ListApprovalRulesUseCase(repository);
}
