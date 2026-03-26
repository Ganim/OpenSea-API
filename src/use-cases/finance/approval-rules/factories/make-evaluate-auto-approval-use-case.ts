import { PrismaFinanceApprovalRulesRepository } from '@/repositories/finance/prisma/prisma-finance-approval-rules-repository';
import { PrismaFinanceEntriesRepository } from '@/repositories/finance/prisma/prisma-finance-entries-repository';
import { makeRegisterPaymentUseCase } from '@/use-cases/finance/entries/factories/make-register-payment-use-case';
import { EvaluateAutoApprovalUseCase } from '../evaluate-auto-approval';

export function makeEvaluateAutoApprovalUseCase() {
  const approvalRulesRepository = new PrismaFinanceApprovalRulesRepository();
  const entriesRepository = new PrismaFinanceEntriesRepository();
  const registerPaymentUseCase = makeRegisterPaymentUseCase();

  return new EvaluateAutoApprovalUseCase(
    approvalRulesRepository,
    entriesRepository,
    registerPaymentUseCase,
  );
}
