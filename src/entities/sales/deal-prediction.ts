import { Entity } from '../domain/entities';
import { Optional } from '../domain/optional';
import { UniqueEntityID } from '../domain/unique-entity-id';

export interface PredictionFactor {
  factor: string;
  impact: number;
  description: string;
}

export interface DealPredictionProps {
  id: UniqueEntityID;
  tenantId: UniqueEntityID;
  dealId: UniqueEntityID;
  probability: number;
  estimatedCloseDate?: Date;
  confidence: 'LOW' | 'MEDIUM' | 'HIGH';
  factors: PredictionFactor[];
  modelVersion: string;
  createdAt: Date;
}

export class DealPrediction extends Entity<DealPredictionProps> {
  get id(): UniqueEntityID {
    return this.props.id;
  }

  get tenantId(): UniqueEntityID {
    return this.props.tenantId;
  }

  get dealId(): UniqueEntityID {
    return this.props.dealId;
  }

  get probability(): number {
    return this.props.probability;
  }

  get estimatedCloseDate(): Date | undefined {
    return this.props.estimatedCloseDate;
  }

  get confidence(): 'LOW' | 'MEDIUM' | 'HIGH' {
    return this.props.confidence;
  }

  get factors(): PredictionFactor[] {
    return this.props.factors;
  }

  get modelVersion(): string {
    return this.props.modelVersion;
  }

  get createdAt(): Date {
    return this.props.createdAt;
  }

  static create(
    props: Optional<
      DealPredictionProps,
      'id' | 'createdAt' | 'confidence' | 'modelVersion' | 'factors'
    >,
    id?: UniqueEntityID,
  ): DealPrediction {
    const probability = Math.max(0, Math.min(1, props.probability));

    let confidence: 'LOW' | 'MEDIUM' | 'HIGH' = props.confidence ?? 'MEDIUM';
    if (!props.confidence) {
      if (probability >= 0.7) confidence = 'HIGH';
      else if (probability >= 0.4) confidence = 'MEDIUM';
      else confidence = 'LOW';
    }

    return new DealPrediction(
      {
        ...props,
        id: id ?? new UniqueEntityID(),
        probability,
        confidence,
        factors: props.factors ?? [],
        modelVersion: props.modelVersion ?? 'v1',
        createdAt: props.createdAt ?? new Date(),
      },
      id,
    );
  }
}
