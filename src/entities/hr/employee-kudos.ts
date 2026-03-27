import { Entity } from '../domain/entities';
import { UniqueEntityID } from '../domain/unique-entity-id';

export type KudosCategory =
  | 'TEAMWORK'
  | 'INNOVATION'
  | 'LEADERSHIP'
  | 'EXCELLENCE'
  | 'HELPFULNESS';

export interface EmployeeKudosProps {
  tenantId: UniqueEntityID;
  fromEmployeeId: UniqueEntityID;
  toEmployeeId: UniqueEntityID;
  message: string;
  category: KudosCategory;
  isPublic: boolean;
  createdAt: Date;
}

export class EmployeeKudos extends Entity<EmployeeKudosProps> {
  get tenantId(): UniqueEntityID {
    return this.props.tenantId;
  }

  get fromEmployeeId(): UniqueEntityID {
    return this.props.fromEmployeeId;
  }

  get toEmployeeId(): UniqueEntityID {
    return this.props.toEmployeeId;
  }

  get message(): string {
    return this.props.message;
  }

  get category(): KudosCategory {
    return this.props.category;
  }

  get isPublic(): boolean {
    return this.props.isPublic;
  }

  get createdAt(): Date {
    return this.props.createdAt;
  }

  isSelfKudos(): boolean {
    return this.fromEmployeeId.equals(this.toEmployeeId);
  }

  private constructor(props: EmployeeKudosProps, id?: UniqueEntityID) {
    super(props, id);
  }

  static create(
    props: Omit<EmployeeKudosProps, 'createdAt'>,
    id?: UniqueEntityID,
  ): EmployeeKudos {
    return new EmployeeKudos(
      {
        ...props,
        createdAt: new Date(),
      },
      id,
    );
  }
}
