import type { ReviewCompetency } from '@/entities/hr/review-competency';

export interface AggregatedCompetencyScores {
  aggregatedSelfScore: number | null;
  aggregatedManagerScore: number | null;
}

/**
 * Calcula a media ponderada de scores das competencias.
 *
 * Formula: SUM(score_i * weight_i) / SUM(weight_i)
 *
 * Apenas competencias com score nao-nulo entram em cada media (self e manager
 * sao calculadas independentemente). Retorna null quando nenhuma competencia
 * possui score do tipo correspondente.
 */
export function aggregateCompetencyScores(
  competencies: ReviewCompetency[],
): AggregatedCompetencyScores {
  return {
    aggregatedSelfScore: weightedAverage(competencies, 'self'),
    aggregatedManagerScore: weightedAverage(competencies, 'manager'),
  };
}

function weightedAverage(
  competencies: ReviewCompetency[],
  type: 'self' | 'manager',
): number | null {
  let weightedSum = 0;
  let weightSum = 0;

  for (const competency of competencies) {
    const score = type === 'self' ? competency.selfScore : competency.managerScore;
    if (score === undefined || score === null) continue;
    weightedSum += score * competency.weight;
    weightSum += competency.weight;
  }

  if (weightSum === 0) return null;
  return Number((weightedSum / weightSum).toFixed(2));
}
