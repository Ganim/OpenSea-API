import { Entity } from '../domain/entities';
import { Optional } from '../domain/optional';
import { UniqueEntityID } from '../domain/unique-entity-id';

export interface TenantUserProps {
  id: UniqueEntityID;
  tenantId: UniqueEntityID;
  userId: UniqueEntityID;
  role: string;
  joinedAt: Date;
  deletedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export class TenantUser extends Entity<TenantUserProps> {
  get tenantUserId(): UniqueEntityID {
    return this.props.id;
  }
  get tenantId(): UniqueEntityID {
    return this.props.tenantId;
  }
  get userId(): UniqueEntityID {
    return this.props.userId;
  }
  get role(): string {
    return this.props.role;
  }
  get joinedAt(): Date {
    return this.props.joinedAt;
  }
  get deletedAt(): Date | null {
    return this.props.deletedAt;
  }
  get createdAt(): Date {
    return this.props.createdAt;
  }
  get updatedAt(): Date {
    return this.props.updatedAt;
  }

  set role(role: string) {
    this.props.role = role;
    this.touch();
  }
  set deletedAt(deletedAt: Date | null) {
    this.props.deletedAt = deletedAt;
    this.touch();
  }

  remove(): void {
    this.deletedAt = new Date();
  }
  restore(): void {
    this.deletedAt = null;
  }

  private touch(): void {
    this.props.updatedAt = new Date();
  }

  static create(
    props: Optional<
      TenantUserProps,
      'id' | 'createdAt' | 'updatedAt' | 'deletedAt' | 'role' | 'joinedAt'
    >,
    id?: UniqueEntityID,
  ): TenantUser {
    const tuId = id ?? props.id ?? new UniqueEntityID();
    return new TenantUser(
      {
        ...props,
        id: tuId,
        role: props.role ?? 'member',
        joinedAt: props.joinedAt ?? new Date(),
        deletedAt: props.deletedAt ?? null,
        createdAt: props.createdAt ?? new Date(),
        updatedAt: props.updatedAt ?? new Date(),
      },
      tuId,
    );
  }
}
