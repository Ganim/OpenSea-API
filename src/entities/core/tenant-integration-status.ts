import { Entity } from '../domain/entities';
import { Optional } from '../domain/optional';
import { UniqueEntityID } from '../domain/unique-entity-id';

export interface TenantIntegrationStatusProps {
  id: UniqueEntityID;
  tenantId: string;
  integrationType: string;
  status: string;
  lastCheckAt: Date | null;
  errorMessage: string | null;
  externalId: string | null;
  metadata: Record<string, unknown> | null;
  createdAt: Date;
  updatedAt: Date | null;
}

export class TenantIntegrationStatus extends Entity<TenantIntegrationStatusProps> {
  get tenantIntegrationStatusId(): UniqueEntityID {
    return this.props.id;
  }
  get tenantId(): string {
    return this.props.tenantId;
  }
  get integrationType(): string {
    return this.props.integrationType;
  }
  get status(): string {
    return this.props.status;
  }
  get lastCheckAt(): Date | null {
    return this.props.lastCheckAt;
  }
  get errorMessage(): string | null {
    return this.props.errorMessage;
  }
  get externalId(): string | null {
    return this.props.externalId;
  }
  get metadata(): Record<string, unknown> | null {
    return this.props.metadata;
  }
  get createdAt(): Date {
    return this.props.createdAt;
  }
  get updatedAt(): Date | null {
    return this.props.updatedAt;
  }

  set status(status: string) {
    this.props.status = status;
    this.touch();
  }
  set lastCheckAt(lastCheckAt: Date | null) {
    this.props.lastCheckAt = lastCheckAt;
    this.touch();
  }
  set errorMessage(errorMessage: string | null) {
    this.props.errorMessage = errorMessage;
    this.touch();
  }
  set externalId(externalId: string | null) {
    this.props.externalId = externalId;
    this.touch();
  }
  set metadata(metadata: Record<string, unknown> | null) {
    this.props.metadata = metadata;
    this.touch();
  }

  private touch(): void {
    this.props.updatedAt = new Date();
  }

  static create(
    props: Optional<
      TenantIntegrationStatusProps,
      | 'id'
      | 'status'
      | 'lastCheckAt'
      | 'errorMessage'
      | 'externalId'
      | 'metadata'
      | 'createdAt'
      | 'updatedAt'
    >,
    id?: UniqueEntityID,
  ): TenantIntegrationStatus {
    const integrationId = id ?? props.id ?? new UniqueEntityID();
    return new TenantIntegrationStatus(
      {
        ...props,
        id: integrationId,
        status: props.status ?? 'NOT_CONFIGURED',
        lastCheckAt: props.lastCheckAt ?? null,
        errorMessage: props.errorMessage ?? null,
        externalId: props.externalId ?? null,
        metadata: props.metadata ?? null,
        createdAt: props.createdAt ?? new Date(),
        updatedAt: props.updatedAt ?? null,
      },
      integrationId,
    );
  }
}
