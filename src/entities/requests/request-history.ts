import { UniqueEntityID } from '@/entities/domain/unique-entity-id';

export interface RequestHistoryProps {
  requestId: UniqueEntityID;
  action: string;
  description: string;
  performedById: UniqueEntityID;
  oldValue?: Record<string, unknown>;
  newValue?: Record<string, unknown>;
  createdAt: Date;
}

export class RequestHistory {
  private _id: UniqueEntityID;
  private props: RequestHistoryProps;

  get id(): UniqueEntityID {
    return this._id;
  }

  get requestId(): UniqueEntityID {
    return this.props.requestId;
  }

  get action(): string {
    return this.props.action;
  }

  get description(): string {
    return this.props.description;
  }

  get performedById(): UniqueEntityID {
    return this.props.performedById;
  }

  get oldValue(): Record<string, unknown> | undefined {
    return this.props.oldValue;
  }

  get newValue(): Record<string, unknown> | undefined {
    return this.props.newValue;
  }

  get createdAt(): Date {
    return this.props.createdAt;
  }

  private constructor(props: RequestHistoryProps, id?: UniqueEntityID) {
    this._id = id ?? new UniqueEntityID();
    this.props = props;
  }

  static create(
    props: RequestHistoryProps,
    id?: UniqueEntityID,
  ): RequestHistory {
    return new RequestHistory(props, id);
  }
}
