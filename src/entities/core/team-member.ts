import { Entity } from '../domain/entities';
import { Optional } from '../domain/optional';
import { UniqueEntityID } from '../domain/unique-entity-id';

export type TeamMemberRole = 'OWNER' | 'ADMIN' | 'MEMBER';

export interface TeamMemberProps {
  id: UniqueEntityID;
  tenantId: UniqueEntityID;
  teamId: UniqueEntityID;
  userId: UniqueEntityID;
  role: TeamMemberRole;
  joinedAt: Date;
  leftAt?: Date;
  createdAt: Date;
  updatedAt?: Date;
}

export class TeamMember extends Entity<TeamMemberProps> {
  get id(): UniqueEntityID {
    return this.props.id;
  }

  get tenantId(): UniqueEntityID {
    return this.props.tenantId;
  }

  get teamId(): UniqueEntityID {
    return this.props.teamId;
  }

  get userId(): UniqueEntityID {
    return this.props.userId;
  }

  get role(): TeamMemberRole {
    return this.props.role;
  }

  set role(role: TeamMemberRole) {
    this.props.role = role;
    this.touch();
  }

  get joinedAt(): Date {
    return this.props.joinedAt;
  }

  get leftAt(): Date | undefined {
    return this.props.leftAt;
  }

  get createdAt(): Date {
    return this.props.createdAt;
  }

  get updatedAt(): Date | undefined {
    return this.props.updatedAt;
  }

  get isActive(): boolean {
    return !this.props.leftAt;
  }

  get isOwner(): boolean {
    return this.props.role === 'OWNER';
  }

  get isAdmin(): boolean {
    return this.props.role === 'ADMIN';
  }

  get isAdminOrOwner(): boolean {
    return this.isOwner || this.isAdmin;
  }

  leave(): void {
    this.props.leftAt = new Date();
    this.touch();
  }

  private touch(): void {
    this.props.updatedAt = new Date();
  }

  static create(
    props: Optional<
      TeamMemberProps,
      'id' | 'role' | 'joinedAt' | 'createdAt' | 'updatedAt' | 'leftAt'
    >,
    id?: UniqueEntityID,
  ): TeamMember {
    return new TeamMember(
      {
        ...props,
        id: id ?? new UniqueEntityID(),
        role: props.role ?? 'MEMBER',
        joinedAt: props.joinedAt ?? new Date(),
        createdAt: props.createdAt ?? new Date(),
        updatedAt: props.updatedAt,
        leftAt: props.leftAt,
      },
      id,
    );
  }
}
