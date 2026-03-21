import { Entity } from '../domain/entities';
import type { Optional } from '../domain/optional';
import { UniqueEntityID } from '../domain/unique-entity-id';

export type MarketplaceOrderStatusType = 'RECEIVED' | 'ACKNOWLEDGED' | 'PROCESSING' | 'SHIPPED' | 'DELIVERED' | 'CANCELLED' | 'RETURNED' | 'DISPUTE';

export interface MarketplaceOrderProps {
  id: UniqueEntityID;
  tenantId: UniqueEntityID;
  connectionId: UniqueEntityID;
  externalOrderId: string;
  externalOrderUrl?: string;
  status: MarketplaceOrderStatusType;
  marketplaceStatus?: string;
  buyerName: string;
  buyerDocument?: string;
  buyerEmail?: string;
  buyerPhone?: string;
  customerId?: string;
  subtotal: number;
  shippingCost: number;
  marketplaceFee: number;
  netAmount: number;
  currency: string;
  shippingMethod?: string;
  trackingCode?: string;
  trackingUrl?: string;
  shippingLabel?: string;
  estimatedDelivery?: Date;
  shippedAt?: Date;
  deliveredAt?: Date;
  deliveryAddress: Record<string, unknown>;
  orderId?: string;
  notes?: string;
  receivedAt: Date;
  acknowledgedAt?: Date;
  processedAt?: Date;
  deletedAt?: Date;
  createdAt: Date;
  updatedAt?: Date;
}

export class MarketplaceOrder extends Entity<MarketplaceOrderProps> {
  get id(): UniqueEntityID { return this.props.id; }
  get tenantId(): UniqueEntityID { return this.props.tenantId; }
  get connectionId(): UniqueEntityID { return this.props.connectionId; }
  get externalOrderId(): string { return this.props.externalOrderId; }
  get externalOrderUrl(): string | undefined { return this.props.externalOrderUrl; }
  get status(): MarketplaceOrderStatusType { return this.props.status; }
  set status(value: MarketplaceOrderStatusType) { this.props.status = value; this.touch(); }
  get marketplaceStatus(): string | undefined { return this.props.marketplaceStatus; }
  get buyerName(): string { return this.props.buyerName; }
  get buyerDocument(): string | undefined { return this.props.buyerDocument; }
  get buyerEmail(): string | undefined { return this.props.buyerEmail; }
  get buyerPhone(): string | undefined { return this.props.buyerPhone; }
  get customerId(): string | undefined { return this.props.customerId; }
  get subtotal(): number { return this.props.subtotal; }
  get shippingCost(): number { return this.props.shippingCost; }
  get marketplaceFee(): number { return this.props.marketplaceFee; }
  get netAmount(): number { return this.props.netAmount; }
  get currency(): string { return this.props.currency; }
  get shippingMethod(): string | undefined { return this.props.shippingMethod; }
  get trackingCode(): string | undefined { return this.props.trackingCode; }
  set trackingCode(value: string | undefined) { this.props.trackingCode = value; this.touch(); }
  get trackingUrl(): string | undefined { return this.props.trackingUrl; }
  set trackingUrl(value: string | undefined) { this.props.trackingUrl = value; this.touch(); }
  get shippingLabel(): string | undefined { return this.props.shippingLabel; }
  get estimatedDelivery(): Date | undefined { return this.props.estimatedDelivery; }
  get shippedAt(): Date | undefined { return this.props.shippedAt; }
  get deliveredAt(): Date | undefined { return this.props.deliveredAt; }
  get deliveryAddress(): Record<string, unknown> { return this.props.deliveryAddress; }
  get orderId(): string | undefined { return this.props.orderId; }
  get notes(): string | undefined { return this.props.notes; }
  get receivedAt(): Date { return this.props.receivedAt; }
  get acknowledgedAt(): Date | undefined { return this.props.acknowledgedAt; }
  get processedAt(): Date | undefined { return this.props.processedAt; }
  get createdAt(): Date { return this.props.createdAt; }
  get updatedAt(): Date | undefined { return this.props.updatedAt; }
  get deletedAt(): Date | undefined { return this.props.deletedAt; }
  get isDeleted(): boolean { return !!this.props.deletedAt; }

  private touch() { this.props.updatedAt = new Date(); }

  acknowledge() {
    this.props.status = 'ACKNOWLEDGED';
    this.props.acknowledgedAt = new Date();
    this.touch();
  }

  markProcessing() {
    this.props.status = 'PROCESSING';
    this.props.processedAt = new Date();
    this.touch();
  }

  markShipped(trackingCode?: string, trackingUrl?: string) {
    this.props.status = 'SHIPPED';
    this.props.shippedAt = new Date();
    if (trackingCode) this.props.trackingCode = trackingCode;
    if (trackingUrl) this.props.trackingUrl = trackingUrl;
    this.touch();
  }

  delete() {
    this.props.deletedAt = new Date();
    this.touch();
  }

  static create(
    props: Optional<MarketplaceOrderProps, 'id' | 'status' | 'shippingCost' | 'marketplaceFee' | 'currency' | 'createdAt'>,
    id?: UniqueEntityID,
  ): MarketplaceOrder {
    return new MarketplaceOrder({
      ...props,
      id: id ?? new UniqueEntityID(),
      status: props.status ?? 'RECEIVED',
      shippingCost: props.shippingCost ?? 0,
      marketplaceFee: props.marketplaceFee ?? 0,
      currency: props.currency ?? 'BRL',
      createdAt: props.createdAt ?? new Date(),
    }, id);
  }
}
