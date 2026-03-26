import { PrismaFinanceApprovalRulesRepository } from '@/repositories/finance/prisma/prisma-finance-approval-rules-repository';
import { UpdateApprovalRuleUseCase } from '../update-approval-rule';

export function makeUpdateApprovalRuleUseCase() {
  const repository = new PrismaFinanceApprovalRulesRepository();
  return new UpdateApprovalRuleUseCase(repository);
}
