import { Entity } from '../domain/entities';
import { Optional } from '../domain/optional';
import { UniqueEntityID } from '../domain/unique-entity-id';

export interface StorageFolderProps {
  id: UniqueEntityID;
  tenantId: UniqueEntityID;
  parentId: UniqueEntityID | null;
  name: string;
  slug: string;
  path: string;
  icon: string | null;
  color: string | null;
  isSystem: boolean;
  isFilter: boolean;
  filterFileType: string | null;
  module: string | null;
  entityType: string | null;
  entityId: string | null;
  depth: number;
  createdBy: string | null;
  createdAt: Date;
  updatedAt: Date;
  deletedAt: Date | null;
}

export class StorageFolder extends Entity<StorageFolderProps> {
  // Getters
  get folderId(): UniqueEntityID {
    return this.props.id;
  }

  get tenantId(): UniqueEntityID {
    return this.props.tenantId;
  }

  get parentId(): UniqueEntityID | null {
    return this.props.parentId;
  }

  get name(): string {
    return this.props.name;
  }

  get slug(): string {
    return this.props.slug;
  }

  get path(): string {
    return this.props.path;
  }

  get icon(): string | null {
    return this.props.icon;
  }

  get color(): string | null {
    return this.props.color;
  }

  get isSystem(): boolean {
    return this.props.isSystem;
  }

  get isFilter(): boolean {
    return this.props.isFilter;
  }

  get filterFileType(): string | null {
    return this.props.filterFileType;
  }

  get module(): string | null {
    return this.props.module;
  }

  get entityType(): string | null {
    return this.props.entityType;
  }

  get entityId(): string | null {
    return this.props.entityId;
  }

  get depth(): number {
    return this.props.depth;
  }

  get createdBy(): string | null {
    return this.props.createdBy;
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

  // Setters
  set name(name: string) {
    this.props.name = name;
    this.touch();
  }

  set slug(slug: string) {
    this.props.slug = slug;
    this.touch();
  }

  set path(path: string) {
    this.props.path = path;
    this.touch();
  }

  set parentId(parentId: UniqueEntityID | null) {
    this.props.parentId = parentId;
    this.touch();
  }

  set icon(icon: string | null) {
    this.props.icon = icon;
    this.touch();
  }

  set color(color: string | null) {
    this.props.color = color;
    this.touch();
  }

  set isFilter(isFilter: boolean) {
    this.props.isFilter = isFilter;
    this.touch();
  }

  set filterFileType(filterFileType: string | null) {
    this.props.filterFileType = filterFileType;
    this.touch();
  }

  set module(module: string | null) {
    this.props.module = module;
    this.touch();
  }

  set entityType(entityType: string | null) {
    this.props.entityType = entityType;
    this.touch();
  }

  set entityId(entityId: string | null) {
    this.props.entityId = entityId;
    this.touch();
  }

  set depth(depth: number) {
    this.props.depth = depth;
    this.touch();
  }

  set deletedAt(deletedAt: Date | null) {
    this.props.deletedAt = deletedAt;
    this.touch();
  }

  // Computed Properties
  get isRoot(): boolean {
    return this.props.parentId === null;
  }

  get isUserDeletable(): boolean {
    return !this.props.isSystem;
  }

  get isDeleted(): boolean {
    return this.props.deletedAt !== null;
  }

  get hasEntityBinding(): boolean {
    return this.props.entityType !== null && this.props.entityId !== null;
  }

  get isModuleFolder(): boolean {
    return this.props.module !== null;
  }

  // Business Methods
  buildChildPath(childSlug: string): string {
    if (this.props.path === '/') {
      return `/${childSlug}`;
    }

    return `${this.props.path}/${childSlug}`;
  }

  delete(): void {
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
      StorageFolderProps,
      | 'id'
      | 'createdAt'
      | 'updatedAt'
      | 'deletedAt'
      | 'isSystem'
      | 'isFilter'
      | 'filterFileType'
      | 'icon'
      | 'color'
      | 'module'
      | 'entityType'
      | 'entityId'
      | 'depth'
      | 'createdBy'
    >,
    id?: UniqueEntityID,
  ): StorageFolder {
    const storageFolder = new StorageFolder(
      {
        ...props,
        id: id ?? new UniqueEntityID(),
        parentId: props.parentId ?? null,
        icon: props.icon ?? null,
        color: props.color ?? null,
        isSystem: props.isSystem ?? false,
        isFilter: props.isFilter ?? false,
        filterFileType: props.filterFileType ?? null,
        module: props.module ?? null,
        entityType: props.entityType ?? null,
        entityId: props.entityId ?? null,
        depth: props.depth ?? 0,
        createdBy: props.createdBy ?? null,
        createdAt: props.createdAt ?? new Date(),
        updatedAt: props.updatedAt ?? new Date(),
        deletedAt: props.deletedAt ?? null,
      },
      id,
    );

    return storageFolder;
  }
}
