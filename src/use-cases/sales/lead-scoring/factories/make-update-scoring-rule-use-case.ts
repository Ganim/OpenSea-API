import { PrismaLeadScoringRulesRepository } from '@/repositories/sales/prisma/prisma-lead-scoring-rules-repository';
import { UpdateScoringRuleUseCase } from '../update-scoring-rule';

export function makeUpdateScoringRuleUseCase() {
  const leadScoringRulesRepository = new PrismaLeadScoringRulesRepository();
  return new UpdateScoringRuleUseCase(leadScoringRulesRepository);
}
