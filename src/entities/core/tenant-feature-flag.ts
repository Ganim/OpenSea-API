import { Entity } from '../domain/entities';
import { Optional } from '../domain/optional';
import { UniqueEntityID } from '../domain/unique-entity-id';

export interface TenantFeatureFlagProps {
  id: UniqueEntityID;
  tenantId: UniqueEntityID;
  flag: string;
  enabled: boolean;
  metadata: Record<string, unknown>;
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
      'id' | 'createdAt' | 'updatedAt' | 'enabled' | 'metadata'
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
        createdAt: props.createdAt ?? new Date(),
        updatedAt: props.updatedAt ?? new Date(),
      },
      ffId,
    );
  }
}
