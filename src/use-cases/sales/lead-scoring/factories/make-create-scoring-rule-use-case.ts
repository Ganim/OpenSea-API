import { PrismaLeadScoringRulesRepository } from '@/repositories/sales/prisma/prisma-lead-scoring-rules-repository';
import { CreateScoringRuleUseCase } from '../create-scoring-rule';

export function makeCreateScoringRuleUseCase() {
  const leadScoringRulesRepository = new PrismaLeadScoringRulesRepository();
  return new CreateScoringRuleUseCase(leadScoringRulesRepository);
}
