import { Entity } from '../domain/entities';
import { Optional } from '../domain/optional';
import { UniqueEntityID } from '../domain/unique-entity-id';

export interface LeadScoreFactor {
  ruleId: string;
  ruleName: string;
  points: number;
  reason: string;
}

export interface LeadScoreProps {
  id: UniqueEntityID;
  tenantId: UniqueEntityID;
  customerId: string;
  score: number;
  tier: string;
  factors: LeadScoreFactor[];
  calculatedAt: Date;
  createdAt: Date;
}

export class LeadScore extends Entity<LeadScoreProps> {
  get id(): UniqueEntityID {
    return this.props.id;
  }

  get tenantId(): UniqueEntityID {
    return this.props.tenantId;
  }

  get customerId(): string {
    return this.props.customerId;
  }

  get score(): number {
    return this.props.score;
  }

  set score(val: number) {
    this.props.score = val;
  }

  get tier(): string {
    return this.props.tier;
  }

  set tier(val: string) {
    this.props.tier = val;
  }

  get factors(): LeadScoreFactor[] {
    return this.props.factors;
  }

  set factors(val: LeadScoreFactor[]) {
    this.props.factors = val;
  }

  get calculatedAt(): Date {
    return this.props.calculatedAt;
  }

  set calculatedAt(val: Date) {
    this.props.calculatedAt = val;
  }

  get createdAt(): Date {
    return this.props.createdAt;
  }

  static determineTier(score: number): string {
    if (score >= 80) return 'HOT';
    if (score >= 50) return 'WARM';
    return 'COLD';
  }

  static create(
    props: Optional<
      LeadScoreProps,
      'id' | 'score' | 'tier' | 'factors' | 'calculatedAt' | 'createdAt'
    >,
    id?: UniqueEntityID,
  ): LeadScore {
    const score = props.score ?? 0;
    return new LeadScore(
      {
        ...props,
        id: id ?? new UniqueEntityID(),
        score,
        tier: props.tier ?? LeadScore.determineTier(score),
        factors: props.factors ?? [],
        calculatedAt: props.calculatedAt ?? new Date(),
        createdAt: props.createdAt ?? new Date(),
      },
      id,
    );
  }
}
