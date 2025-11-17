import { Entity } from '../domain/entities';
import { Optional } from '../domain/optional';
import { UniqueEntityID } from '../domain/unique-entity-id';

export interface UserPermissionGroupProps {
  id: UniqueEntityID;
  userId: UniqueEntityID;
  groupId: UniqueEntityID;
  expiresAt: Date | null;
  grantedBy: UniqueEntityID | null;
  createdAt: Date;
}

/**
 * Entidade UserPermissionGroup
 *
 * Representa a atribuição de um Grupo de Permissões a um Usuário.
 * Pode ter data de expiração para acessos temporários.
 */
export class UserPermissionGroup extends Entity<UserPermissionGroupProps> {
  get id(): UniqueEntityID {
    return this.props.id;
  }

  get userId(): UniqueEntityID {
    return this.props.userId;
  }

  get groupId(): UniqueEntityID {
    return this.props.groupId;
  }

  get expiresAt(): Date | null {
    return this.props.expiresAt;
  }

  get grantedBy(): UniqueEntityID | null {
    return this.props.grantedBy;
  }

  get createdAt(): Date {
    return this.props.createdAt;
  }

  get isExpired(): boolean {
    if (!this.props.expiresAt) {
      return false;
    }

    return new Date() > this.props.expiresAt;
  }

  get hasExpiration(): boolean {
    return !!this.props.expiresAt;
  }

  set expiresAt(expiresAt: Date | null) {
    this.props.expiresAt = expiresAt;
  }

  /**
   * Define data de expiração a partir de agora + dias
   */
  setExpirationDays(days: number) {
    const expirationDate = new Date();
    expirationDate.setDate(expirationDate.getDate() + days);
    this.props.expiresAt = expirationDate;
  }

  /**
   * Remove a data de expiração (acesso permanente)
   */
  removeExpiration() {
    this.props.expiresAt = null;
  }

  static create(
    props: Optional<
      UserPermissionGroupProps,
      'createdAt' | 'expiresAt' | 'grantedBy'
    >,
    id?: UniqueEntityID,
  ) {
    const userGroup = new UserPermissionGroup(
      {
        ...props,
        expiresAt: props.expiresAt ?? null,
        grantedBy: props.grantedBy ?? null,
        createdAt: props.createdAt ?? new Date(),
      },
      id,
    );

    return userGroup;
  }
}
