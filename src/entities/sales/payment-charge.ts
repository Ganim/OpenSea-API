import { Entity } from '../domain/entities';
import type { Optional } from '../domain/optional';
import { UniqueEntityID } from '../domain/unique-entity-id';
import type { PosPaymentMethod } from './pos-transaction-payment';

export type PaymentChargeStatus =
  | 'PENDING'
  | 'PAID'
  | 'EXPIRED'
  | 'FAILED'
  | 'REFUNDED'
  | 'CANCELLED';

export interface PaymentChargeProps {
  id: UniqueEntityID;
  tenantId: UniqueEntityID;
  orderId: UniqueEntityID;
  transactionPaymentId?: UniqueEntityID;
  provider: string;
  providerChargeId?: string;
  method: PosPaymentMethod;
  amount: number;
  status: PaymentChargeStatus;
  qrCode?: string;
  checkoutUrl?: string;
  boletoUrl?: string;
  boletoBarcode?: string;
  paidAt?: Date;
  paidAmount?: number;
  expiresAt?: Date;
  rawResponse?: unknown;
  webhookData?: unknown;
  createdAt: Date;
  updatedAt: Date;
}

export class PaymentCharge extends Entity<PaymentChargeProps> {
  get tenantId() {
    return this.props.tenantId;
  }
  get orderId() {
    return this.props.orderId;
  }
  get transactionPaymentId() {
    return this.props.transactionPaymentId;
  }
  set transactionPaymentId(value: UniqueEntityID | undefined) {
    this.props.transactionPaymentId = value;
  }
  get provider() {
    return this.props.provider;
  }
  get providerChargeId() {
    return this.props.providerChargeId;
  }
  set providerChargeId(value: string | undefined) {
    this.props.providerChargeId = value;
  }
  get method() {
    return this.props.method;
  }
  get amount() {
    return this.props.amount;
  }
  get status() {
    return this.props.status;
  }
  set status(value: PaymentChargeStatus) {
    this.props.status = value;
  }
  get qrCode() {
    return this.props.qrCode;
  }
  set qrCode(value: string | undefined) {
    this.props.qrCode = value;
  }
  get checkoutUrl() {
    return this.props.checkoutUrl;
  }
  set checkoutUrl(value: string | undefined) {
    this.props.checkoutUrl = value;
  }
  get boletoUrl() {
    return this.props.boletoUrl;
  }
  set boletoUrl(value: string | undefined) {
    this.props.boletoUrl = value;
  }
  get boletoBarcode() {
    return this.props.boletoBarcode;
  }
  set boletoBarcode(value: string | undefined) {
    this.props.boletoBarcode = value;
  }
  get paidAt() {
    return this.props.paidAt;
  }
  set paidAt(value: Date | undefined) {
    this.props.paidAt = value;
  }
  get paidAmount() {
    return this.props.paidAmount;
  }
  set paidAmount(value: number | undefined) {
    this.props.paidAmount = value;
  }
  get expiresAt() {
    return this.props.expiresAt;
  }
  set expiresAt(value: Date | undefined) {
    this.props.expiresAt = value;
  }
  get rawResponse() {
    return this.props.rawResponse;
  }
  set rawResponse(value: unknown) {
    this.props.rawResponse = value;
  }
  get webhookData() {
    return this.props.webhookData;
  }
  set webhookData(value: unknown) {
    this.props.webhookData = value;
  }
  get createdAt() {
    return this.props.createdAt;
  }
  get updatedAt() {
    return this.props.updatedAt;
  }

  get isPending() {
    return this.props.status === 'PENDING';
  }

  get isPaid() {
    return this.props.status === 'PAID';
  }

  markAsPaid(paidAmount: number, paidAt?: Date) {
    this.props.status = 'PAID';
    this.props.paidAmount = paidAmount;
    this.props.paidAt = paidAt ?? new Date();
  }

  markAsFailed() {
    this.props.status = 'FAILED';
  }

  markAsExpired() {
    this.props.status = 'EXPIRED';
  }

  static create(
    props: Optional<
      PaymentChargeProps,
      'id' | 'createdAt' | 'updatedAt' | 'status'
    >,
    id?: UniqueEntityID,
  ) {
    return new PaymentCharge(
      {
        ...props,
        id: props.id ?? new UniqueEntityID(),
        status: props.status ?? 'PENDING',
        createdAt: props.createdAt ?? new Date(),
        updatedAt: props.updatedAt ?? new Date(),
      },
      id ?? props.id,
    );
  }
}
