import { Entity } from '../domain/entities';
import type { Optional } from '../domain/optional';
import { UniqueEntityID } from '../domain/unique-entity-id';

export type PosCashMovementType =
  | 'OPENING'
  | 'WITHDRAWAL'
  | 'SUPPLY'
  | 'CLOSING';

export interface PosCashMovementProps {
  id: UniqueEntityID;
  tenantId: UniqueEntityID;
  sessionId: UniqueEntityID;
  type: PosCashMovementType;
  amount: number;
  reason?: string;
  performedByUserId: UniqueEntityID;
  authorizedByUserId?: UniqueEntityID;
  createdAt: Date;
}

export class PosCashMovement extends Entity<PosCashMovementProps> {
  get tenantId() {
    return this.props.tenantId;
  }
  get sessionId() {
    return this.props.sessionId;
  }
  get type() {
    return this.props.type;
  }
  get amount() {
    return this.props.amount;
  }
  get reason() {
    return this.props.reason;
  }
  get performedByUserId() {
    return this.props.performedByUserId;
  }
  get authorizedByUserId() {
    return this.props.authorizedByUserId;
  }
  get createdAt() {
    return this.props.createdAt;
  }

  static create(
    props: Optional<PosCashMovementProps, 'id' | 'createdAt'>,
    id?: UniqueEntityID,
  ) {
    return new PosCashMovement(
      {
        ...props,
        id: props.id ?? new UniqueEntityID(),
        createdAt: props.createdAt ?? new Date(),
      },
      id ?? props.id,
    );
  }
}
