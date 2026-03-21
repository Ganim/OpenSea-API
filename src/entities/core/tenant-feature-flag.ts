import { Entity } from '../domain/entities';
import { Optional } from '../domain/optional';
import { UniqueEntityID } from '../domain/unique-entity-id';

export interface TenantFeatureFlagProps {
  id: UniqueEntityID;
  tenantId: UniqueEntityID;
  flag: string;
  enabled: boolean;
  metadata: Record<string, unknown>;
  category: string;
  expiresAt: Date | null;
  enabledByUserId: string | null;
  notes: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export class TenantFeatureFlag extends Entity<TenantFeatureFlagProps> {
  get tenantFeatureFlagId(): UniqueEntityID {
    return this.props.id;
  }
  get tenantId(): UniqueEntityID {
    return this.props.tenantId;
  }
  get flag(): string {
    return this.props.flag;
  }
  get enabled(): boolean {
    return this.props.enabled;
  }
  get metadata(): Record<string, unknown> {
    return this.props.metadata;
  }
  get createdAt(): Date {
    return this.props.createdAt;
  }
  get category(): string {
    return this.props.category;
  }
  get expiresAt(): Date | null {
    return this.props.expiresAt;
  }
  get enabledByUserId(): string | null {
    return this.props.enabledByUserId;
  }
  get notes(): string | null {
    return this.props.notes;
  }
  get updatedAt(): Date {
    return this.props.updatedAt;
  }

  set enabled(enabled: boolean) {
    this.props.enabled = enabled;
    this.touch();
  }
  set metadata(metadata: Record<string, unknown>) {
    this.props.metadata = metadata;
    this.touch();
  }
  set category(category: string) {
    this.props.category = category;
    this.touch();
  }
  set expiresAt(expiresAt: Date | null) {
    this.props.expiresAt = expiresAt;
    this.touch();
  }
  set enabledByUserId(enabledByUserId: string | null) {
    this.props.enabledByUserId = enabledByUserId;
    this.touch();
  }
  set notes(notes: string | null) {
    this.props.notes = notes;
    this.touch();
  }

  enable(): void {
    this.enabled = true;
  }
  disable(): void {
    this.enabled = false;
  }
  toggle(): void {
    this.enabled = !this.enabled;
  }

  private touch(): void {
    this.props.updatedAt = new Date();
  }

  static create(
    props: Optional<
      TenantFeatureFlagProps,
      | 'id'
      | 'createdAt'
      | 'updatedAt'
      | 'enabled'
      | 'metadata'
      | 'category'
      | 'expiresAt'
      | 'enabledByUserId'
      | 'notes'
    >,
    id?: UniqueEntityID,
  ): TenantFeatureFlag {
    const ffId = id ?? props.id ?? new UniqueEntityID();
    return new TenantFeatureFlag(
      {
        ...props,
        id: ffId,
        enabled: props.enabled ?? false,
        metadata: props.metadata ?? {},
        category: props.category ?? 'BETA',
        expiresAt: props.expiresAt ?? null,
        enabledByUserId: props.enabledByUserId ?? null,
        notes: props.notes ?? null,
        createdAt: props.createdAt ?? new Date(),
        updatedAt: props.updatedAt ?? new Date(),
      },
      ffId,
    );
  }
}
