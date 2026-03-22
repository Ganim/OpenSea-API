import { Entity } from '../domain/entities';
import type { Optional } from '../domain/optional';
import { UniqueEntityID } from '../domain/unique-entity-id';

export type PosPaymentMethod =
  | 'CASH'
  | 'CREDIT_CARD'
  | 'DEBIT_CARD'
  | 'PIX'
  | 'BOLETO'
  | 'STORE_CREDIT'
  | 'VOUCHER'
  | 'PAYMENT_LINK'
  | 'NFC'
  | 'CHECK'
  | 'OTHER';

export type PosPaymentLinkStatus = 'PENDING' | 'PAID' | 'EXPIRED';

export interface PosTransactionPaymentProps {
  id: UniqueEntityID;
  tenantId: UniqueEntityID;
  transactionId: UniqueEntityID;
  method: PosPaymentMethod;
  amount: number;
  receivedAmount?: number;
  changeAmount?: number;
  installments: number;
  authCode?: string;
  nsu?: string;
  pixTxId?: string;
  paymentLinkUrl?: string;
  paymentLinkStatus?: PosPaymentLinkStatus;
  tefTransactionId?: string;
  notes?: string;
  createdAt: Date;
}

export class PosTransactionPayment extends Entity<PosTransactionPaymentProps> {
  get tenantId() {
    return this.props.tenantId;
  }
  get transactionId() {
    return this.props.transactionId;
  }
  get method() {
    return this.props.method;
  }
  get amount() {
    return this.props.amount;
  }
  get receivedAmount() {
    return this.props.receivedAmount;
  }
  get changeAmount() {
    return this.props.changeAmount;
  }
  get installments() {
    return this.props.installments;
  }
  get authCode() {
    return this.props.authCode;
  }
  get nsu() {
    return this.props.nsu;
  }
  get pixTxId() {
    return this.props.pixTxId;
  }
  get paymentLinkUrl() {
    return this.props.paymentLinkUrl;
  }
  get paymentLinkStatus() {
    return this.props.paymentLinkStatus;
  }
  get tefTransactionId() {
    return this.props.tefTransactionId;
  }
  get notes() {
    return this.props.notes;
  }
  get createdAt() {
    return this.props.createdAt;
  }

  static create(
    props: Optional<
      PosTransactionPaymentProps,
      'id' | 'createdAt' | 'installments'
    >,
    id?: UniqueEntityID,
  ) {
    return new PosTransactionPayment(
      {
        ...props,
        id: props.id ?? new UniqueEntityID(),
        installments: props.installments ?? 1,
        createdAt: props.createdAt ?? new Date(),
      },
      id ?? props.id,
    );
  }
}
