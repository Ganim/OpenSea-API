import { Entity } from '../domain/entities';
import { Optional } from '../domain/optional';
import { UniqueEntityID } from '../domain/unique-entity-id';

export interface FinanceEntryCostCenterProps {
  id: UniqueEntityID;
  entryId: UniqueEntityID;
  costCenterId: UniqueEntityID;
  percentage: number;
  amount: number;
  createdAt: Date;
}

export class FinanceEntryCostCenter extends Entity<FinanceEntryCostCenterProps> {
  get id(): UniqueEntityID {
    return this.props.id;
  }

  get entryId(): UniqueEntityID {
    return this.props.entryId;
  }

  get costCenterId(): UniqueEntityID {
    return this.props.costCenterId;
  }

  get percentage(): number {
    return this.props.percentage;
  }

  get amount(): number {
    return this.props.amount;
  }

  get createdAt(): Date {
    return this.props.createdAt;
  }

  static create(
    props: Optional<FinanceEntryCostCenterProps, 'id' | 'createdAt'>,
    id?: UniqueEntityID,
  ): FinanceEntryCostCenter {
    return new FinanceEntryCostCenter(
      {
        ...props,
        id: id ?? new UniqueEntityID(),
        createdAt: props.createdAt ?? new Date(),
      },
      id,
    );
  }
}
