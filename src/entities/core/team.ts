import { Entity } from '../domain/entities';
import { Optional } from '../domain/optional';
import { UniqueEntityID } from '../domain/unique-entity-id';

export interface TeamProps {
  id: UniqueEntityID;
  tenantId: UniqueEntityID;
  name: string;
  slug: string;
  description?: string;
  avatarUrl?: string;
  color?: string;
  isActive: boolean;
  permissionGroupId?: UniqueEntityID;
  storageFolderId?: UniqueEntityID;
  settings: Record<string, unknown>;
  createdBy: UniqueEntityID;
  deletedAt?: Date;
  createdAt: Date;
  updatedAt?: Date;
}

export class Team extends Entity<TeamProps> {
  get id(): UniqueEntityID {
    return this.props.id;
  }

  get tenantId(): UniqueEntityID {
    return this.props.tenantId;
  }

  get name(): string {
    return this.props.name;
  }

  set name(name: string) {
    this.props.name = name;
    this.touch();
  }

  get slug(): string {
    return this.props.slug;
  }

  set slug(slug: string) {
    this.props.slug = slug;
    this.touch();
  }

  get description(): string | undefined {
    return this.props.description;
  }

  set description(description: string | undefined) {
    this.props.description = description;
    this.touch();
  }

  get avatarUrl(): string | undefined {
    return this.props.avatarUrl;
  }

  set avatarUrl(avatarUrl: string | undefined) {
    this.props.avatarUrl = avatarUrl;
    this.touch();
  }

  get color(): string | undefined {
    return this.props.color;
  }

  set color(color: string | undefined) {
    this.props.color = color;
    this.touch();
  }

  get isActive(): boolean {
    return this.props.isActive;
  }

  set isActive(isActive: boolean) {
    this.props.isActive = isActive;
    this.touch();
  }

  get permissionGroupId(): UniqueEntityID | undefined {
    return this.props.permissionGroupId;
  }

  set permissionGroupId(id: UniqueEntityID | undefined) {
    this.props.permissionGroupId = id;
    this.touch();
  }

  get storageFolderId(): UniqueEntityID | undefined {
    return this.props.storageFolderId;
  }

  set storageFolderId(id: UniqueEntityID | undefined) {
    this.props.storageFolderId = id;
    this.touch();
  }

  get settings(): Record<string, unknown> {
    return this.props.settings;
  }

  set settings(settings: Record<string, unknown>) {
    this.props.settings = settings;
    this.touch();
  }

  get createdBy(): UniqueEntityID {
    return this.props.createdBy;
  }

  get deletedAt(): Date | undefined {
    return this.props.deletedAt;
  }

  get createdAt(): Date {
    return this.props.createdAt;
  }

  get updatedAt(): Date | undefined {
    return this.props.updatedAt;
  }

  get isDeleted(): boolean {
    return !!this.props.deletedAt;
  }

  delete(): void {
    this.props.deletedAt = new Date();
    this.props.isActive = false;
    this.touch();
  }

  restore(): void {
    this.props.deletedAt = undefined;
    this.props.isActive = true;
    this.touch();
  }

  private touch(): void {
    this.props.updatedAt = new Date();
  }

  static create(
    props: Optional<
      TeamProps,
      'id' | 'isActive' | 'settings' | 'createdAt' | 'updatedAt' | 'deletedAt'
    >,
    id?: UniqueEntityID,
  ): Team {
    return new Team(
      {
        ...props,
        id: id ?? new UniqueEntityID(),
        isActive: props.isActive ?? true,
        settings: props.settings ?? {},
        createdAt: props.createdAt ?? new Date(),
        updatedAt: props.updatedAt,
        deletedAt: props.deletedAt,
      },
      id,
    );
  }
}
