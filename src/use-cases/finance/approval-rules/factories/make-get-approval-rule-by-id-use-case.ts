import { PrismaFinanceApprovalRulesRepository } from '@/repositories/finance/prisma/prisma-finance-approval-rules-repository';
import { GetApprovalRuleByIdUseCase } from '../get-approval-rule-by-id';

export function makeGetApprovalRuleByIdUseCase() {
  const repository = new PrismaFinanceApprovalRulesRepository();
  return new GetApprovalRuleByIdUseCase(repository);
}
