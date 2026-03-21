import { Entity } from '../domain/entities';
import type { Optional } from '../domain/optional';
import { UniqueEntityID } from '../domain/unique-entity-id';

export type MarketplacePaymentTypeValue = 'SALE' | 'REFUND' | 'COMMISSION' | 'SHIPPING_FEE' | 'AD_CHARGE' | 'FULFILLMENT_FEE' | 'ADJUSTMENT' | 'TRANSFER';
export type MarketplacePaymentStatusType = 'PENDING' | 'SETTLED' | 'DISPUTED' | 'CANCELLED';

export interface MarketplacePaymentProps {
  id: UniqueEntityID;
  tenantId: UniqueEntityID;
  connectionId: UniqueEntityID;
  externalPaymentId?: string;
  type: MarketplacePaymentTypeValue;
  description?: string;
  grossAmount: number;
  feeAmount: number;
  netAmount: number;
  currency: string;
  marketplaceOrderId?: string;
  installmentNumber?: number;
  settlementDate?: Date;
  status: MarketplacePaymentStatusType;
  financeEntryId?: string;
  metadata?: Record<string, unknown>;
  createdAt: Date;
  updatedAt?: Date;
}

export class MarketplacePayment extends Entity<MarketplacePaymentProps> {
  get id(): UniqueEntityID { return this.props.id; }
  get tenantId(): UniqueEntityID { return this.props.tenantId; }
  get connectionId(): UniqueEntityID { return this.props.connectionId; }
  get externalPaymentId(): string | undefined { return this.props.externalPaymentId; }
  get type(): MarketplacePaymentTypeValue { return this.props.type; }
  get description(): string | undefined { return this.props.description; }
  get grossAmount(): number { return this.props.grossAmount; }
  get feeAmount(): number { return this.props.feeAmount; }
  get netAmount(): number { return this.props.netAmount; }
  get currency(): string { return this.props.currency; }
  get marketplaceOrderId(): string | undefined { return this.props.marketplaceOrderId; }
  get installmentNumber(): number | undefined { return this.props.installmentNumber; }
  get settlementDate(): Date | undefined { return this.props.settlementDate; }
  get status(): MarketplacePaymentStatusType { return this.props.status; }
  get financeEntryId(): string | undefined { return this.props.financeEntryId; }
  get metadata(): Record<string, unknown> | undefined { return this.props.metadata; }
  get createdAt(): Date { return this.props.createdAt; }
  get updatedAt(): Date | undefined { return this.props.updatedAt; }

  static create(
    props: Optional<MarketplacePaymentProps, 'id' | 'feeAmount' | 'status' | 'createdAt'>,
    id?: UniqueEntityID,
  ): MarketplacePayment {
    return new MarketplacePayment({
      ...props,
      id: id ?? new UniqueEntityID(),
      feeAmount: props.feeAmount ?? 0,
      status: props.status ?? 'PENDING',
      createdAt: props.createdAt ?? new Date(),
    }, id);
  }
}
