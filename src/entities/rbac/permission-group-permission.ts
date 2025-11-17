import { Entity } from '../domain/entities';
import { Optional } from '../domain/optional';
import { UniqueEntityID } from '../domain/unique-entity-id';
import { PermissionEffect } from './value-objects/permission-effect';

export interface PermissionGroupPermissionProps {
  id: UniqueEntityID;
  groupId: UniqueEntityID;
  permissionId: UniqueEntityID;
  effect: PermissionEffect;
  conditions: Record<string, unknown> | null;
  createdAt: Date;
}

/**
 * Entidade PermissionGroupPermission
 *
 * Representa o relacionamento entre um Grupo e uma Permissão.
 * Inclui o efeito (allow/deny) e condições opcionais (para ABAC futuro).
 */
export class PermissionGroupPermission extends Entity<PermissionGroupPermissionProps> {
  get id(): UniqueEntityID {
    return this.props.id;
  }

  get groupId(): UniqueEntityID {
    return this.props.groupId;
  }

  get permissionId(): UniqueEntityID {
    return this.props.permissionId;
  }

  get effect(): PermissionEffect {
    return this.props.effect;
  }

  get conditions(): Record<string, unknown> | null {
    return this.props.conditions;
  }

  get createdAt(): Date {
    return this.props.createdAt;
  }

  get isAllow(): boolean {
    return this.props.effect.isAllow;
  }

  get isDeny(): boolean {
    return this.props.effect.isDeny;
  }

  get hasConditions(): boolean {
    return (
      !!this.props.conditions && Object.keys(this.props.conditions).length > 0
    );
  }

  set effect(effect: PermissionEffect) {
    this.props.effect = effect;
  }

  set conditions(conditions: Record<string, unknown> | null) {
    this.props.conditions = conditions;
  }

  static create(
    props: Optional<PermissionGroupPermissionProps, 'createdAt' | 'conditions'>,
    id?: UniqueEntityID,
  ) {
    const groupPermission = new PermissionGroupPermission(
      {
        ...props,
        conditions: props.conditions ?? null,
        createdAt: props.createdAt ?? new Date(),
      },
      id,
    );

    return groupPermission;
  }
}
