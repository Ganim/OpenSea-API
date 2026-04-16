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
  isPinned: boolean;
  pinnedAt?: Date | null;
  pinnedBy?: UniqueEntityID | null;
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

  get isPinned(): boolean {
    return this.props.isPinned;
  }

  get pinnedAt(): Date | null | undefined {
    return this.props.pinnedAt;
  }

  get pinnedBy(): UniqueEntityID | null | undefined {
    return this.props.pinnedBy;
  }

  get createdAt(): Date {
    return this.props.createdAt;
  }

  isSelfKudos(): boolean {
    return this.fromEmployeeId.equals(this.toEmployeeId);
  }

  pin(pinnedByEmployeeId: UniqueEntityID): void {
    this.props.isPinned = true;
    this.props.pinnedAt = new Date();
    this.props.pinnedBy = pinnedByEmployeeId;
  }

  unpin(): void {
    this.props.isPinned = false;
    this.props.pinnedAt = null;
    this.props.pinnedBy = null;
  }

  private constructor(props: EmployeeKudosProps, id?: UniqueEntityID) {
    super(props, id);
  }

  static create(
    props: Omit<EmployeeKudosProps, 'createdAt' | 'isPinned'> & {
      createdAt?: Date;
      isPinned?: boolean;
      pinnedAt?: Date | null;
      pinnedBy?: UniqueEntityID | null;
    },
    id?: UniqueEntityID,
  ): EmployeeKudos {
    return new EmployeeKudos(
      {
        tenantId: props.tenantId,
        fromEmployeeId: props.fromEmployeeId,
        toEmployeeId: props.toEmployeeId,
        message: props.message,
        category: props.category,
        isPublic: props.isPublic,
        isPinned: props.isPinned ?? false,
        pinnedAt: props.pinnedAt ?? null,
        pinnedBy: props.pinnedBy ?? null,
        createdAt: props.createdAt ?? new Date(),
      },
      id,
    );
  }
}
