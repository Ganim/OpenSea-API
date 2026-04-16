import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import { ReviewCompetency } from '@/entities/hr/review-competency';
import { describe, expect, it } from 'vitest';
import { aggregateCompetencyScores } from './aggregate-competency-scores';

const tenantId = new UniqueEntityID();
const reviewId = new UniqueEntityID();

function buildCompetency(props: {
  name: string;
  selfScore?: number;
  managerScore?: number;
  weight?: number;
}) {
  return ReviewCompetency.create({
    tenantId,
    reviewId,
    name: props.name,
    selfScore: props.selfScore,
    managerScore: props.managerScore,
    weight: props.weight,
  });
}

describe('Aggregate Competency Scores', () => {
  it('should return null aggregates when there are no competencies', () => {
    const result = aggregateCompetencyScores([]);
    expect(result.aggregatedSelfScore).toBeNull();
    expect(result.aggregatedManagerScore).toBeNull();
  });

  it('should compute weighted averages correctly', () => {
    const competencies = [
      buildCompetency({ name: 'A', selfScore: 4, managerScore: 5, weight: 2 }),
      buildCompetency({ name: 'B', selfScore: 3, managerScore: 4, weight: 1 }),
    ];

    const result = aggregateCompetencyScores(competencies);

    expect(result.aggregatedSelfScore).toBe(3.67);
    expect(result.aggregatedManagerScore).toBe(4.67);
  });

  it('should ignore competencies missing the corresponding score type', () => {
    const competencies = [
      buildCompetency({ name: 'A', selfScore: 4, weight: 1 }),
      buildCompetency({ name: 'B', managerScore: 3, weight: 1 }),
    ];

    const result = aggregateCompetencyScores(competencies);

    expect(result.aggregatedSelfScore).toBe(4);
    expect(result.aggregatedManagerScore).toBe(3);
  });

  it('should return null when all weights collapse to zero (no scores)', () => {
    const competencies = [
      buildCompetency({ name: 'A', weight: 1 }),
      buildCompetency({ name: 'B', weight: 2 }),
    ];

    const result = aggregateCompetencyScores(competencies);

    expect(result.aggregatedSelfScore).toBeNull();
    expect(result.aggregatedManagerScore).toBeNull();
  });

  it('should default weight to 1 when not provided', () => {
    const competencies = [
      buildCompetency({ name: 'A', selfScore: 4 }),
      buildCompetency({ name: 'B', selfScore: 2 }),
    ];

    const result = aggregateCompetencyScores(competencies);

    expect(result.aggregatedSelfScore).toBe(3);
  });
});
