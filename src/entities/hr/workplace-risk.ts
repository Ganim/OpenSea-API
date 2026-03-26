import { Entity } from '../domain/entities';
import { UniqueEntityID } from '../domain/unique-entity-id';

export type WorkplaceRiskCategory =
  | 'FISICO'
  | 'QUIMICO'
  | 'BIOLOGICO'
  | 'ERGONOMICO'
  | 'ACIDENTE';

export type WorkplaceRiskSeverity = 'BAIXO' | 'MEDIO' | 'ALTO' | 'CRITICO';

export interface WorkplaceRiskProps {
  tenantId: UniqueEntityID;
  safetyProgramId: UniqueEntityID;
  name: string;
  category: WorkplaceRiskCategory;
  severity: WorkplaceRiskSeverity;
  source?: string;
  affectedArea?: string;
  controlMeasures?: string;
  epiRequired?: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export class WorkplaceRisk extends Entity<WorkplaceRiskProps> {
  get tenantId(): UniqueEntityID {
    return this.props.tenantId;
  }

  get safetyProgramId(): UniqueEntityID {
    return this.props.safetyProgramId;
  }

  get name(): string {
    return this.props.name;
  }

  get category(): WorkplaceRiskCategory {
    return this.props.category;
  }

  get severity(): WorkplaceRiskSeverity {
    return this.props.severity;
  }

  get source(): string | undefined {
    return this.props.source;
  }

  get affectedArea(): string | undefined {
    return this.props.affectedArea;
  }

  get controlMeasures(): string | undefined {
    return this.props.controlMeasures;
  }

  get epiRequired(): string | undefined {
    return this.props.epiRequired;
  }

  get isActive(): boolean {
    return this.props.isActive;
  }

  get createdAt(): Date {
    return this.props.createdAt;
  }

  get updatedAt(): Date {
    return this.props.updatedAt;
  }

  isCritical(): boolean {
    return this.severity === 'CRITICO';
  }

  private constructor(props: WorkplaceRiskProps, id?: UniqueEntityID) {
    super(props, id);
  }

  static create(
    props: Omit<WorkplaceRiskProps, 'createdAt' | 'updatedAt'> & {
      createdAt?: Date;
      updatedAt?: Date;
    },
    id?: UniqueEntityID,
  ): WorkplaceRisk {
    const now = new Date();

    if (!props.name || props.name.trim().length === 0) {
      throw new Error('Nome do risco é obrigatório');
    }

    return new WorkplaceRisk(
      {
        ...props,
        name: props.name.trim(),
        createdAt: props.createdAt ?? now,
        updatedAt: props.updatedAt ?? now,
      },
      id,
    );
  }
}
