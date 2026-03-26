import { PrismaFinanceApprovalRulesRepository } from '@/repositories/finance/prisma/prisma-finance-approval-rules-repository';
import { CreateApprovalRuleUseCase } from '../create-approval-rule';

export function makeCreateApprovalRuleUseCase() {
  const repository = new PrismaFinanceApprovalRulesRepository();
  return new CreateApprovalRuleUseCase(repository);
}
