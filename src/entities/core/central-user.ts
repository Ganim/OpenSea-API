import { Entity } from '../domain/entities';
import { Optional } from '../domain/optional';
import { UniqueEntityID } from '../domain/unique-entity-id';

export interface CentralUserProps {
  id: UniqueEntityID;
  userId: string;
  role: string;
  isActive: boolean;
  invitedBy: string | null;
  createdAt: Date;
  updatedAt: Date | null;
}

export class CentralUser extends Entity<CentralUserProps> {
  get centralUserId(): UniqueEntityID {
    return this.props.id;
  }
  get userId(): string {
    return this.props.userId;
  }
  get role(): string {
    return this.props.role;
  }
  get isActive(): boolean {
    return this.props.isActive;
  }
  get invitedBy(): string | null {
    return this.props.invitedBy;
  }
  get createdAt(): Date {
    return this.props.createdAt;
  }
  get updatedAt(): Date | null {
    return this.props.updatedAt;
  }

  set role(role: string) {
    this.props.role = role;
    this.touch();
  }
  set isActive(isActive: boolean) {
    this.props.isActive = isActive;
    this.touch();
  }

  private touch(): void {
    this.props.updatedAt = new Date();
  }

  static create(
    props: Optional<
      CentralUserProps,
      'id' | 'role' | 'isActive' | 'invitedBy' | 'createdAt' | 'updatedAt'
    >,
    id?: UniqueEntityID,
  ): CentralUser {
    const centralUserId = id ?? props.id ?? new UniqueEntityID();
    return new CentralUser(
      {
        ...props,
        id: centralUserId,
        role: props.role ?? 'VIEWER',
        isActive: props.isActive ?? true,
        invitedBy: props.invitedBy ?? null,
        createdAt: props.createdAt ?? new Date(),
        updatedAt: props.updatedAt ?? null,
      },
      centralUserId,
    );
  }
}
