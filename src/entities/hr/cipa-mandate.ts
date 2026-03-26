import { Entity } from '../domain/entities';
import { UniqueEntityID } from '../domain/unique-entity-id';

export type CipaMandateStatus = 'ACTIVE' | 'EXPIRED' | 'DRAFT';

export interface CipaMandateProps {
  tenantId: UniqueEntityID;
  name: string;
  startDate: Date;
  endDate: Date;
  status: CipaMandateStatus;
  electionDate?: Date;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

export class CipaMandate extends Entity<CipaMandateProps> {
  get tenantId(): UniqueEntityID {
    return this.props.tenantId;
  }

  get name(): string {
    return this.props.name;
  }

  get startDate(): Date {
    return this.props.startDate;
  }

  get endDate(): Date {
    return this.props.endDate;
  }

  get status(): CipaMandateStatus {
    return this.props.status;
  }

  get electionDate(): Date | undefined {
    return this.props.electionDate;
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

  isActive(): boolean {
    return this.status === 'ACTIVE';
  }

  isExpired(): boolean {
    return new Date() > this.endDate;
  }

  private constructor(props: CipaMandateProps, id?: UniqueEntityID) {
    super(props, id);
  }

  static create(
    props: Omit<CipaMandateProps, 'createdAt' | 'updatedAt'> & {
      createdAt?: Date;
      updatedAt?: Date;
    },
    id?: UniqueEntityID,
  ): CipaMandate {
    const now = new Date();

    if (!props.name || props.name.trim().length === 0) {
      throw new Error('Nome do mandato é obrigatório');
    }

    return new CipaMandate(
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
