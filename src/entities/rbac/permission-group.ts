import { Entity } from '../domain/entities';
import { Optional } from '../domain/optional';
import { UniqueEntityID } from '../domain/unique-entity-id';

export interface PermissionGroupProps {
  id: UniqueEntityID;
  name: string;
  slug: string;
  description: string | null;
  isSystem: boolean;
  isActive: boolean;
  color: string | null;
  priority: number;
  parentId: UniqueEntityID | null;
  tenantId: UniqueEntityID | null;
  createdAt: Date;
  updatedAt: Date;
  deletedAt: Date | null;
}

/**
 * Entidade PermissionGroup (Grupo de Permissões)
 *
 * Representa um grupo de permissões customizável (equivalente a uma Role).
 * Grupos podem ter hierarquia (parentId) para herança de permissões.
 */
export class PermissionGroup extends Entity<PermissionGroupProps> {
  get id(): UniqueEntityID {
    return this.props.id;
  }

  get name(): string {
    return this.props.name;
  }

  get slug(): string {
    return this.props.slug;
  }

  get description(): string | null {
    return this.props.description;
  }

  get isSystem(): boolean {
    return this.props.isSystem;
  }

  get isActive(): boolean {
    return this.props.isActive;
  }

  get color(): string | null {
    return this.props.color;
  }

  get priority(): number {
    return this.props.priority;
  }

  get parentId(): UniqueEntityID | null {
    return this.props.parentId;
  }

  get tenantId(): UniqueEntityID | null {
    return this.props.tenantId;
  }

  get createdAt(): Date {
    return this.props.createdAt;
  }

  get updatedAt(): Date {
    return this.props.updatedAt;
  }

  get deletedAt(): Date | null {
    return this.props.deletedAt;
  }

  get isDeleted(): boolean {
    return !!this.props.deletedAt;
  }

  get hasParent(): boolean {
    return !!this.props.parentId;
  }

  private touch() {
    this.props.updatedAt = new Date();
  }

  set name(name: string) {
    this.props.name = name;
    this.touch();
  }

  set slug(slug: string) {
    this.props.slug = slug;
    this.touch();
  }

  set description(description: string | null) {
    this.props.description = description;
    this.touch();
  }

  set isActive(isActive: boolean) {
    this.props.isActive = isActive;
    this.touch();
  }

  set color(color: string | null) {
    this.props.color = color;
    this.touch();
  }

  set priority(priority: number) {
    this.props.priority = priority;
    this.touch();
  }

  set parentId(parentId: UniqueEntityID | null) {
    this.props.parentId = parentId;
    this.touch();
  }

  set deletedAt(deletedAt: Date | null) {
    this.props.deletedAt = deletedAt;
    this.touch();
  }

  /**
   * Marca o grupo como deletado (soft delete)
   */
  delete() {
    this.props.deletedAt = new Date();
    this.touch();
  }

  /**
   * Restaura o grupo deletado
   */
  restore() {
    this.props.deletedAt = null;
    this.touch();
  }

  /**
   * Ativa o grupo
   */
  activate() {
    this.props.isActive = true;
    this.touch();
  }

  /**
   * Desativa o grupo
   */
  deactivate() {
    this.props.isActive = false;
    this.touch();
  }

  static create(
    props: Optional<
      PermissionGroupProps,
      | 'createdAt'
      | 'updatedAt'
      | 'deletedAt'
      | 'isSystem'
      | 'isActive'
      | 'priority'
      | 'tenantId'
    >,
    id?: UniqueEntityID,
  ) {
    const group = new PermissionGroup(
      {
        ...props,
        isSystem: props.isSystem ?? false,
        isActive: props.isActive ?? true,
        priority: props.priority ?? 0,
        tenantId: props.tenantId ?? null,
        createdAt: props.createdAt ?? new Date(),
        updatedAt: props.updatedAt ?? new Date(),
        deletedAt: props.deletedAt ?? null,
      },
      id,
    );

    return group;
  }
}
