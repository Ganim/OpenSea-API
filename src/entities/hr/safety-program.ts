import { Entity } from '../domain/entities';
import { UniqueEntityID } from '../domain/unique-entity-id';

export type SafetyProgramType = 'PCMSO' | 'PGR' | 'LTCAT' | 'PPRA';

export type SafetyProgramStatus = 'ACTIVE' | 'EXPIRED' | 'DRAFT';

export interface SafetyProgramProps {
  tenantId: UniqueEntityID;
  type: SafetyProgramType;
  name: string;
  validFrom: Date;
  validUntil: Date;
  responsibleName: string;
  responsibleRegistration: string;
  documentUrl?: string;
  status: SafetyProgramStatus;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

export class SafetyProgram extends Entity<SafetyProgramProps> {
  get tenantId(): UniqueEntityID {
    return this.props.tenantId;
  }

  get type(): SafetyProgramType {
    return this.props.type;
  }

  get name(): string {
    return this.props.name;
  }

  get validFrom(): Date {
    return this.props.validFrom;
  }

  get validUntil(): Date {
    return this.props.validUntil;
  }

  get responsibleName(): string {
    return this.props.responsibleName;
  }

  get responsibleRegistration(): string {
    return this.props.responsibleRegistration;
  }

  get documentUrl(): string | undefined {
    return this.props.documentUrl;
  }

  get status(): SafetyProgramStatus {
    return this.props.status;
  }

  get notes(): string | undefined {
    return this.props.notes;
  }

  get createdAt(): Date {
    return this.props.createdAt;
  }

  get updatedAt(): Date {
    return this.props.updatedAt;
  }

  isExpired(): boolean {
    return new Date() > this.validUntil;
  }

  isActive(): boolean {
    return this.status === 'ACTIVE';
  }

  private constructor(props: SafetyProgramProps, id?: UniqueEntityID) {
    super(props, id);
  }

  static create(
    props: Omit<SafetyProgramProps, 'createdAt' | 'updatedAt'> & {
      createdAt?: Date;
      updatedAt?: Date;
    },
    id?: UniqueEntityID,
  ): SafetyProgram {
    const now = new Date();

    if (!props.name || props.name.trim().length === 0) {
      throw new Error('Nome do programa é obrigatório');
    }

    if (!props.responsibleName || props.responsibleName.trim().length === 0) {
      throw new Error('Nome do responsável é obrigatório');
    }

    if (
      !props.responsibleRegistration ||
      props.responsibleRegistration.trim().length === 0
    ) {
      throw new Error('Registro profissional do responsável é obrigatório');
    }

    return new SafetyProgram(
      {
        ...props,
        name: props.name.trim(),
        responsibleName: props.responsibleName.trim(),
        responsibleRegistration: props.responsibleRegistration.trim(),
        createdAt: props.createdAt ?? now,
        updatedAt: props.updatedAt ?? now,
      },
      id,
    );
  }
}
