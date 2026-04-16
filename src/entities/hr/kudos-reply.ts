import { Entity } from '../domain/entities';
import { UniqueEntityID } from '../domain/unique-entity-id';

export interface KudosReplyProps {
  tenantId: UniqueEntityID;
  kudosId: UniqueEntityID;
  employeeId: UniqueEntityID;
  content: string;
  createdAt: Date;
  updatedAt: Date;
  deletedAt?: Date | null;
}

export class KudosReply extends Entity<KudosReplyProps> {
  get tenantId(): UniqueEntityID {
    return this.props.tenantId;
  }

  get kudosId(): UniqueEntityID {
    return this.props.kudosId;
  }

  get employeeId(): UniqueEntityID {
    return this.props.employeeId;
  }

  get content(): string {
    return this.props.content;
  }

  set content(value: string) {
    this.props.content = value;
    this.props.updatedAt = new Date();
  }

  get createdAt(): Date {
    return this.props.createdAt;
  }

  get updatedAt(): Date {
    return this.props.updatedAt;
  }

  get deletedAt(): Date | null | undefined {
    return this.props.deletedAt;
  }

  isDeleted(): boolean {
    return this.props.deletedAt !== null && this.props.deletedAt !== undefined;
  }

  isAuthoredBy(employeeId: UniqueEntityID): boolean {
    return this.props.employeeId.equals(employeeId);
  }

  softDelete(): void {
    this.props.deletedAt = new Date();
    this.props.updatedAt = new Date();
  }

  private constructor(props: KudosReplyProps, id?: UniqueEntityID) {
    super(props, id);
  }

  static create(
    props: Omit<KudosReplyProps, 'createdAt' | 'updatedAt' | 'deletedAt'> & {
      createdAt?: Date;
      updatedAt?: Date;
      deletedAt?: Date | null;
    },
    id?: UniqueEntityID,
  ): KudosReply {
    const now = new Date();
    return new KudosReply(
      {
        tenantId: props.tenantId,
        kudosId: props.kudosId,
        employeeId: props.employeeId,
        content: props.content,
        createdAt: props.createdAt ?? now,
        updatedAt: props.updatedAt ?? now,
        deletedAt: props.deletedAt ?? null,
      },
      id,
    );
  }
}
