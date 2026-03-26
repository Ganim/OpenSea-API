import type { LeadScore, LeadScoreFactor } from '@/entities/sales/lead-score';

export interface LeadScoreDTO {
  id: string;
  customerId: string;
  score: number;
  tier: string;
  factors: LeadScoreFactor[];
  calculatedAt: Date;
  createdAt: Date;
}

export function leadScoreToDTO(leadScore: LeadScore): LeadScoreDTO {
  return {
    id: leadScore.id.toString(),
    customerId: leadScore.customerId,
    score: leadScore.score,
    tier: leadScore.tier,
    factors: leadScore.factors,
    calculatedAt: leadScore.calculatedAt,
    createdAt: leadScore.createdAt,
  };
}
