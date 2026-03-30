import { Entity } from '../domain/entities';
import { UniqueEntityID } from '../domain/unique-entity-id';

export type PPECondition = 'NEW' | 'GOOD' | 'WORN' | 'DAMAGED';

export type PPEAssignmentStatus = 'ACTIVE' | 'RETURNED' | 'EXPIRED' | 'LOST';

export interface PPEAssignmentProps {
  tenantId: UniqueEntityID;
  ppeItemId: UniqueEntityID;
  employeeId: UniqueEntityID;
  assignedAt: Date;
  returnedAt?: Date;
  expiresAt?: Date;
  condition: PPECondition;
  returnCondition?: PPECondition;
  quantity: number;
  notes?: string;
  status: PPEAssignmentStatus;
  createdAt: Date;
  updatedAt: Date;
}

export class PPEAssignment extends Entity<PPEAssignmentProps> {
  get tenantId(): UniqueEntityID {
    return this.props.tenantId;
  }

  get ppeItemId(): UniqueEntityID {
    return this.props.ppeItemId;
  }

  get employeeId(): UniqueEntityID {
    return this.props.employeeId;
  }

  get assignedAt(): Date {
    return this.props.assignedAt;
  }

  get returnedAt(): Date | undefined {
    return this.props.returnedAt;
  }

  get expiresAt(): Date | undefined {
    return this.props.expiresAt;
  }

  get condition(): PPECondition {
    return this.props.condition;
  }

  get returnCondition(): PPECondition | undefined {
    return this.props.returnCondition;
  }

  get quantity(): number {
    return this.props.quantity;
  }

  get notes(): string | undefined {
    return this.props.notes;
  }

  get status(): PPEAssignmentStatus {
    return this.props.status;
  }

  get createdAt(): Date {
    return this.props.createdAt;
  }

  get updatedAt(): Date {
    return this.props.updatedAt;
  }

  isExpired(): boolean {
    if (!this.expiresAt) return false;
    return new Date() > this.expiresAt;
  }

  isActive(): boolean {
    return this.status === 'ACTIVE';
  }

  private constructor(props: PPEAssignmentProps, id?: UniqueEntityID) {
    super(props, id);
  }

  static create(
    props: Omit<PPEAssignmentProps, 'createdAt' | 'updatedAt'> & {
      createdAt?: Date;
      updatedAt?: Date;
    },
    id?: UniqueEntityID,
  ): PPEAssignment {
    const now = new Date();

    if (props.quantity < 1) {
      throw new Error('Quantidade deve ser pelo menos 1');
    }

    return new PPEAssignment(
      {
        ...props,
        assignedAt: props.assignedAt ?? now,
        condition: props.condition ?? 'NEW',
        status: props.status ?? 'ACTIVE',
        quantity: props.quantity ?? 1,
        createdAt: props.createdAt ?? now,
        updatedAt: props.updatedAt ?? now,
      },
      id,
    );
  }
}
