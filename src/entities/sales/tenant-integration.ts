import { Entity } from '../domain/entities';
import { Optional } from '../domain/optional';
import { UniqueEntityID } from '../domain/unique-entity-id';
import type { Integration } from './integration';

export interface TenantIntegrationProps {
  id: UniqueEntityID;
  tenantId: UniqueEntityID;
  integrationId: UniqueEntityID;
  config: Record<string, unknown>;
  status: string;
  lastSyncAt?: Date;
  errorMessage?: string;
  createdAt: Date;
  updatedAt?: Date;
  integration?: Integration;
}

export class TenantIntegration extends Entity<TenantIntegrationProps> {
  get id(): UniqueEntityID {
    return this.props.id;
  }

  get tenantId(): UniqueEntityID {
    return this.props.tenantId;
  }

  get integrationId(): UniqueEntityID {
    return this.props.integrationId;
  }

  get config(): Record<string, unknown> {
    return this.props.config;
  }

  set config(value: Record<string, unknown>) {
    this.props.config = value;
    this.touch();
  }

  get status(): string {
    return this.props.status;
  }

  set status(value: string) {
    this.props.status = value;
    this.touch();
  }

  get lastSyncAt(): Date | undefined {
    return this.props.lastSyncAt;
  }

  set lastSyncAt(value: Date | undefined) {
    this.props.lastSyncAt = value;
    this.touch();
  }

  get errorMessage(): string | undefined {
    return this.props.errorMessage;
  }

  set errorMessage(value: string | undefined) {
    this.props.errorMessage = value;
    this.touch();
  }

  get createdAt(): Date {
    return this.props.createdAt;
  }

  get updatedAt(): Date | undefined {
    return this.props.updatedAt;
  }

  get integration(): Integration | undefined {
    return this.props.integration;
  }

  private touch() {
    this.props.updatedAt = new Date();
  }

  disconnect() {
    this.props.status = 'DISCONNECTED';
    this.props.config = {};
    this.props.errorMessage = undefined;
    this.touch();
  }

  markSynced() {
    this.props.lastSyncAt = new Date();
    this.props.errorMessage = undefined;
    this.touch();
  }

  static create(
    props: Optional<
      TenantIntegrationProps,
      'id' | 'status' | 'createdAt' | 'config'
    >,
    id?: UniqueEntityID,
  ): TenantIntegration {
    const tenantIntegration = new TenantIntegration(
      {
        ...props,
        id: id ?? new UniqueEntityID(),
        config: props.config ?? {},
        status: props.status ?? 'DISCONNECTED',
        createdAt: props.createdAt ?? new Date(),
      },
      id,
    );

    return tenantIntegration;
  }
}
