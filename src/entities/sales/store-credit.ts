import { Entity } from '../domain/entities';
import type { Optional } from '../domain/optional';
import { UniqueEntityID } from '../domain/unique-entity-id';

export type StoreCreditSource = 'RETURN' | 'MANUAL' | 'CAMPAIGN' | 'LOYALTY';

export interface StoreCreditProps {
  id: UniqueEntityID;
  tenantId: UniqueEntityID;
  customerId: UniqueEntityID;
  amount: number;
  balance: number;
  source: StoreCreditSource;
  sourceId?: string;
  reservedForOrderId?: UniqueEntityID;
  expiresAt?: Date;
  isActive: boolean;
  createdAt: Date;
  updatedAt?: Date;
}

export class StoreCredit extends Entity<StoreCreditProps> {
  get id(): UniqueEntityID {
    return this.props.id;
  }

  get tenantId(): UniqueEntityID {
    return this.props.tenantId;
  }

  get customerId(): UniqueEntityID {
    return this.props.customerId;
  }

  get amount(): number {
    return this.props.amount;
  }

  get balance(): number {
    return this.props.balance;
  }

  get source(): StoreCreditSource {
    return this.props.source;
  }

  get sourceId(): string | undefined {
    return this.props.sourceId;
  }

  get reservedForOrderId(): UniqueEntityID | undefined {
    return this.props.reservedForOrderId;
  }

  get expiresAt(): Date | undefined {
    return this.props.expiresAt;
  }

  get isActive(): boolean {
    return this.props.isActive;
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

  get availableBalance(): number {
    if (!this.props.isActive || this.isExpired) return 0;
    return this.props.balance;
  }

  useCredit(amount: number): void {
    if (amount <= 0) {
      throw new Error('Credit usage amount must be positive');
    }
    if (amount > this.props.balance) {
      throw new Error('Insufficient credit balance');
    }
    this.props.balance -= amount;
    if (this.props.balance === 0) {
      this.props.isActive = false;
    }
    this.touch();
  }

  deactivate(): void {
    this.props.isActive = false;
    this.touch();
  }

  private touch(): void {
    this.props.updatedAt = new Date();
  }

  static create(
    props: Optional<
      StoreCreditProps,
      'id' | 'createdAt' | 'updatedAt' | 'balance' | 'isActive'
    >,
    id?: UniqueEntityID,
  ): StoreCredit {
    return new StoreCredit(
      {
        ...props,
        id: id ?? new UniqueEntityID(),
        balance: props.balance ?? props.amount,
        isActive: props.isActive ?? true,
        createdAt: props.createdAt ?? new Date(),
        updatedAt: props.updatedAt,
      },
      id,
    );
  }
}
