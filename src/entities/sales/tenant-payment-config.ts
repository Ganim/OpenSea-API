import { Entity } from '../domain/entities';
import type { Optional } from '../domain/optional';
import { UniqueEntityID } from '../domain/unique-entity-id';

export interface TenantPaymentConfigProps {
  id: UniqueEntityID;
  tenantId: UniqueEntityID;
  primaryProvider: string;
  primaryConfig: string;
  primaryActive: boolean;
  primaryTestedAt?: Date;
  fallbackProvider?: string;
  fallbackConfig?: string;
  fallbackActive: boolean;
  fallbackTestedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export class TenantPaymentConfig extends Entity<TenantPaymentConfigProps> {
  get tenantId() {
    return this.props.tenantId;
  }
  get primaryProvider() {
    return this.props.primaryProvider;
  }
  set primaryProvider(value: string) {
    this.props.primaryProvider = value;
  }
  get primaryConfig() {
    return this.props.primaryConfig;
  }
  set primaryConfig(value: string) {
    this.props.primaryConfig = value;
  }
  get primaryActive() {
    return this.props.primaryActive;
  }
  set primaryActive(value: boolean) {
    this.props.primaryActive = value;
  }
  get primaryTestedAt() {
    return this.props.primaryTestedAt;
  }
  set primaryTestedAt(value: Date | undefined) {
    this.props.primaryTestedAt = value;
  }
  get fallbackProvider() {
    return this.props.fallbackProvider;
  }
  set fallbackProvider(value: string | undefined) {
    this.props.fallbackProvider = value;
  }
  get fallbackConfig() {
    return this.props.fallbackConfig;
  }
  set fallbackConfig(value: string | undefined) {
    this.props.fallbackConfig = value;
  }
  get fallbackActive() {
    return this.props.fallbackActive;
  }
  set fallbackActive(value: boolean) {
    this.props.fallbackActive = value;
  }
  get fallbackTestedAt() {
    return this.props.fallbackTestedAt;
  }
  set fallbackTestedAt(value: Date | undefined) {
    this.props.fallbackTestedAt = value;
  }
  get createdAt() {
    return this.props.createdAt;
  }
  get updatedAt() {
    return this.props.updatedAt;
  }

  static create(
    props: Optional<
      TenantPaymentConfigProps,
      'id' | 'createdAt' | 'updatedAt' | 'primaryActive' | 'fallbackActive'
    >,
    id?: UniqueEntityID,
  ) {
    return new TenantPaymentConfig(
      {
        ...props,
        id: props.id ?? new UniqueEntityID(),
        primaryActive: props.primaryActive ?? false,
        fallbackActive: props.fallbackActive ?? false,
        createdAt: props.createdAt ?? new Date(),
        updatedAt: props.updatedAt ?? new Date(),
      },
      id ?? props.id,
    );
  }
}
