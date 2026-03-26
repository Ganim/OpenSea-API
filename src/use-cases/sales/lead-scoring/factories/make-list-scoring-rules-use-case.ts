import { PrismaLeadScoringRulesRepository } from '@/repositories/sales/prisma/prisma-lead-scoring-rules-repository';
import { ListScoringRulesUseCase } from '../list-scoring-rules';

export function makeListScoringRulesUseCase() {
  const leadScoringRulesRepository = new PrismaLeadScoringRulesRepository();
  return new ListScoringRulesUseCase(leadScoringRulesRepository);
}
