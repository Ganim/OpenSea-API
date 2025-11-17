import { Entity } from '../domain/entities';
import { Optional } from '../domain/optional';
import { UniqueEntityID } from '../domain/unique-entity-id';
import { PermissionCode } from './value-objects/permission-code';

export interface PermissionProps {
  id: UniqueEntityID;
  code: PermissionCode;
  name: string;
  description: string | null;
  module: string;
  resource: string;
  action: string;
  isSystem: boolean;
  metadata: Record<string, unknown>;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Entidade Permission (Permissão)
 *
 * Representa uma permissão específica no sistema.
 * Cada permissão é identificada por um código único no formato module.resource.action
 */
export class Permission extends Entity<PermissionProps> {
  get id(): UniqueEntityID {
    return this.props.id;
  }

  get code(): PermissionCode {
    return this.props.code;
  }

  get name(): string {
    return this.props.name;
  }

  get description(): string | null {
    return this.props.description;
  }

  get module(): string {
    return this.props.module;
  }

  get resource(): string {
    return this.props.resource;
  }

  get action(): string {
    return this.props.action;
  }

  get isSystem(): boolean {
    return this.props.isSystem;
  }

  get metadata(): Record<string, unknown> {
    return this.props.metadata;
  }

  get createdAt(): Date {
    return this.props.createdAt;
  }

  get updatedAt(): Date {
    return this.props.updatedAt;
  }

  private touch() {
    this.props.updatedAt = new Date();
  }

  set name(name: string) {
    this.props.name = name;
    this.touch();
  }

  set description(description: string | null) {
    this.props.description = description;
    this.touch();
  }

  set metadata(metadata: Record<string, unknown>) {
    this.props.metadata = metadata;
    this.touch();
  }

  /**
   * Verifica se esta permissão corresponde a um código (suporta wildcards)
   */
  matches(code: PermissionCode): boolean {
    return this.props.code.matches(code);
  }

  static create(
    props: Optional<
      PermissionProps,
      'createdAt' | 'updatedAt' | 'isSystem' | 'metadata'
    >,
    id?: UniqueEntityID,
  ) {
    const permission = new Permission(
      {
        ...props,
        isSystem: props.isSystem ?? false,
        metadata: props.metadata ?? {},
        createdAt: props.createdAt ?? new Date(),
        updatedAt: props.updatedAt ?? new Date(),
      },
      id,
    );

    return permission;
  }
}
