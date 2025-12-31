import { Entity } from '../domain/entities';
import { Optional } from '../domain/optional';
import { UniqueEntityID } from '../domain/unique-entity-id';

export interface UserDirectPermissionProps {
  id: UniqueEntityID;
  userId: UniqueEntityID;
  permissionId: UniqueEntityID;
  effect: 'allow' | 'deny';
  conditions: Record<string, unknown> | null;
  expiresAt: Date | null;
  grantedBy: UniqueEntityID | null;
  createdAt: Date;
}

/**
 * Entidade UserDirectPermission
 *
 * Representa uma permissão atribuída diretamente a um usuário (sem passar por grupos).
 * Permite controle granular de permissões individuais.
 * Suporta efeitos (allow/deny), condições ABAC e expiração.
 */
export class UserDirectPermission extends Entity<UserDirectPermissionProps> {
  get id(): UniqueEntityID {
    return this.props.id;
  }

  get userId(): UniqueEntityID {
    return this.props.userId;
  }

  get permissionId(): UniqueEntityID {
    return this.props.permissionId;
  }

  get effect(): 'allow' | 'deny' {
    return this.props.effect;
  }

  get conditions(): Record<string, unknown> | null {
    return this.props.conditions;
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

  get isDeny(): boolean {
    return this.props.effect === 'deny';
  }

  get isAllow(): boolean {
    return this.props.effect === 'allow';
  }

  get hasConditions(): boolean {
    return (
      !!this.props.conditions && Object.keys(this.props.conditions).length > 0
    );
  }

  set expiresAt(expiresAt: Date | null) {
    this.props.expiresAt = expiresAt;
  }

  set effect(effect: 'allow' | 'deny') {
    this.props.effect = effect;
  }

  set conditions(conditions: Record<string, unknown> | null) {
    this.props.conditions = conditions;
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
      UserDirectPermissionProps,
      'createdAt' | 'expiresAt' | 'grantedBy' | 'conditions' | 'effect'
    >,
    id?: UniqueEntityID,
  ) {
    const userDirectPermission = new UserDirectPermission(
      {
        ...props,
        effect: props.effect ?? 'allow',
        conditions: props.conditions ?? null,
        expiresAt: props.expiresAt ?? null,
        grantedBy: props.grantedBy ?? null,
        createdAt: props.createdAt ?? new Date(),
      },
      id,
    );

    return userDirectPermission;
  }
}
