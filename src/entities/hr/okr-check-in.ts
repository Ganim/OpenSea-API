import { Entity } from '../domain/entities';
import { UniqueEntityID } from '../domain/unique-entity-id';

export interface OKRCheckInProps {
  tenantId: UniqueEntityID;
  keyResultId: UniqueEntityID;
  employeeId: UniqueEntityID;
  previousValue: number;
  newValue: number;
  note?: string;
  confidence: string;
  createdAt: Date;
}

export class OKRCheckIn extends Entity<OKRCheckInProps> {
  get tenantId(): UniqueEntityID {
    return this.props.tenantId;
  }

  get keyResultId(): UniqueEntityID {
    return this.props.keyResultId;
  }

  get employeeId(): UniqueEntityID {
    return this.props.employeeId;
  }

  get previousValue(): number {
    return this.props.previousValue;
  }

  get newValue(): number {
    return this.props.newValue;
  }

  get note(): string | undefined {
    return this.props.note;
  }

  get confidence(): string {
    return this.props.confidence;
  }

  get createdAt(): Date {
    return this.props.createdAt;
  }

  private constructor(props: OKRCheckInProps, id?: UniqueEntityID) {
    super(props, id);
  }

  static create(
    props: Omit<OKRCheckInProps, 'createdAt'> & {
      createdAt?: Date;
    },
    id?: UniqueEntityID,
  ): OKRCheckIn {
    const now = new Date();

    return new OKRCheckIn(
      {
        ...props,
        createdAt: props.createdAt ?? now,
      },
      id,
    );
  }
}
