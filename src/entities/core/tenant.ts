import { Entity } from '../domain/entities';
import { Optional } from '../domain/optional';
import { UniqueEntityID } from '../domain/unique-entity-id';

export type TenantStatus = 'ACTIVE' | 'INACTIVE' | 'SUSPENDED';

export interface TenantProps {
  id: UniqueEntityID;
  name: string;
  slug: string;
  logoUrl: string | null;
  status: TenantStatus;
  settings: Record<string, unknown>;
  metadata: Record<string, unknown>;
  deletedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export class Tenant extends Entity<TenantProps> {
  get tenantId(): UniqueEntityID {
    return this.props.id;
  }
  get name(): string {
    return this.props.name;
  }
  get slug(): string {
    return this.props.slug;
  }
  get logoUrl(): string | null {
    return this.props.logoUrl;
  }
  get status(): TenantStatus {
    return this.props.status;
  }
  get settings(): Record<string, unknown> {
    return this.props.settings;
  }
  get metadata(): Record<string, unknown> {
    return this.props.metadata;
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

  get isActive(): boolean {
    return this.status === 'ACTIVE';
  }
  get isSuspended(): boolean {
    return this.status === 'SUSPENDED';
  }
  get isInactive(): boolean {
    return this.status === 'INACTIVE';
  }

  set name(name: string) {
    this.props.name = name;
    this.touch();
  }
  set slug(slug: string) {
    this.props.slug = slug;
    this.touch();
  }
  set logoUrl(logoUrl: string | null) {
    this.props.logoUrl = logoUrl;
    this.touch();
  }
  set status(status: TenantStatus) {
    this.props.status = status;
    this.touch();
  }
  set settings(settings: Record<string, unknown>) {
    this.props.settings = settings;
    this.touch();
  }
  set metadata(metadata: Record<string, unknown>) {
    this.props.metadata = metadata;
    this.touch();
  }
  set deletedAt(deletedAt: Date | null) {
    this.props.deletedAt = deletedAt;
    this.touch();
  }

  activate(): void {
    this.status = 'ACTIVE';
  }
  suspend(): void {
    this.status = 'SUSPENDED';
  }
  deactivate(): void {
    this.status = 'INACTIVE';
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
      TenantProps,
      | 'id'
      | 'createdAt'
      | 'updatedAt'
      | 'deletedAt'
      | 'logoUrl'
      | 'status'
      | 'settings'
      | 'metadata'
    >,
    id?: UniqueEntityID,
  ): Tenant {
    const tenantId = id ?? props.id ?? new UniqueEntityID();
    return new Tenant(
      {
        ...props,
        id: tenantId,
        logoUrl: props.logoUrl ?? null,
        status: props.status ?? 'ACTIVE',
        settings: props.settings ?? {},
        metadata: props.metadata ?? {},
        deletedAt: props.deletedAt ?? null,
        createdAt: props.createdAt ?? new Date(),
        updatedAt: props.updatedAt ?? new Date(),
      },
      tenantId,
    );
  }

  static generateSlug(name: string): string {
    return name
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^\w\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .trim();
  }
}
