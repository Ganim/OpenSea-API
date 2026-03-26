import { PrismaFinanceApprovalRulesRepository } from '@/repositories/finance/prisma/prisma-finance-approval-rules-repository';
import { DeleteApprovalRuleUseCase } from '../delete-approval-rule';

export function makeDeleteApprovalRuleUseCase() {
  const repository = new PrismaFinanceApprovalRulesRepository();
  return new DeleteApprovalRuleUseCase(repository);
}
