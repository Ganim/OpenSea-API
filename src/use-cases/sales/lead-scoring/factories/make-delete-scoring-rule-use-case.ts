import { PrismaLeadScoringRulesRepository } from '@/repositories/sales/prisma/prisma-lead-scoring-rules-repository';
import { DeleteScoringRuleUseCase } from '../delete-scoring-rule';

export function makeDeleteScoringRuleUseCase() {
  const leadScoringRulesRepository = new PrismaLeadScoringRulesRepository();
  return new DeleteScoringRuleUseCase(leadScoringRulesRepository);
}
