import { Entity } from '../domain/entities';
import { Optional } from '../domain/optional';
import { UniqueEntityID } from '../domain/unique-entity-id';

export interface CustomerPortalAccessProps {
  id: UniqueEntityID;
  tenantId: UniqueEntityID;
  customerId: string;
  accessToken: string;
  contactId?: string;
  isActive: boolean;
  permissions: Record<string, boolean>;
  lastAccessAt?: Date;
  expiresAt?: Date;
  createdAt: Date;
  updatedAt?: Date;
}

export class CustomerPortalAccess extends Entity<CustomerPortalAccessProps> {
  get id(): UniqueEntityID {
    return this.props.id;
  }

  get tenantId(): UniqueEntityID {
    return this.props.tenantId;
  }

  get customerId(): string {
    return this.props.customerId;
  }

  get accessToken(): string {
    return this.props.accessToken;
  }

  get contactId(): string | undefined {
    return this.props.contactId;
  }

  get isActive(): boolean {
    return this.props.isActive;
  }

  set isActive(value: boolean) {
    this.props.isActive = value;
    this.touch();
  }

  get permissions(): Record<string, boolean> {
    return this.props.permissions;
  }

  get lastAccessAt(): Date | undefined {
    return this.props.lastAccessAt;
  }

  get expiresAt(): Date | undefined {
    return this.props.expiresAt;
  }

  get createdAt(): Date {
    return this.props.createdAt;
  }

  get updatedAt(): Date | undefined {
    return this.props.updatedAt;
  }

  get isExpired(): boolean {
    if (!this.props.expiresAt) return false;
    return new Date() > this.props.expiresAt;
  }

  private touch() {
    this.props.updatedAt = new Date();
  }

  recordAccess() {
    this.props.lastAccessAt = new Date();
    this.touch();
  }

  revoke() {
    this.props.isActive = false;
    this.touch();
  }

  static create(
    props: Optional<CustomerPortalAccessProps, 'id' | 'isActive' | 'permissions' | 'createdAt'>,
    id?: UniqueEntityID,
  ): CustomerPortalAccess {
    return new CustomerPortalAccess(
      {
        ...props,
        id: id ?? new UniqueEntityID(),
        isActive: props.isActive ?? true,
        permissions: props.permissions ?? {
          viewOrders: true,
          viewInvoices: true,
          viewProposals: true,
        },
        createdAt: props.createdAt ?? new Date(),
      },
      id,
    );
  }
}
