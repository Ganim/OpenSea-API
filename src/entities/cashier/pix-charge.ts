import { Entity } from '../domain/entities';
import { Optional } from '../domain/optional';
import { UniqueEntityID } from '../domain/unique-entity-id';

export type PixChargeStatus = 'ACTIVE' | 'COMPLETED' | 'EXPIRED' | 'CANCELLED';

export interface PixChargeProps {
  id: UniqueEntityID;
  tenantId: string;
  txId: string;
  location: string;
  pixCopiaECola: string;
  amount: number;
  status: PixChargeStatus;
  payerName: string | null;
  payerCpfCnpj: string | null;
  endToEndId: string | null;
  posTransactionPaymentId: string | null;
  orderId: string | null;
  expiresAt: Date;
  paidAt: Date | null;
  provider: string;
  providerData: Record<string, unknown> | null;
  createdAt: Date;
  updatedAt: Date | null;
}

export class PixCharge extends Entity<PixChargeProps> {
  get pixChargeId(): UniqueEntityID {
    return this.props.id;
  }
  get tenantId(): string {
    return this.props.tenantId;
  }
  get txId(): string {
    return this.props.txId;
  }
  get location(): string {
    return this.props.location;
  }
  get pixCopiaECola(): string {
    return this.props.pixCopiaECola;
  }
  get amount(): number {
    return this.props.amount;
  }
  get status(): PixChargeStatus {
    return this.props.status;
  }
  get payerName(): string | null {
    return this.props.payerName;
  }
  get payerCpfCnpj(): string | null {
    return this.props.payerCpfCnpj;
  }
  get endToEndId(): string | null {
    return this.props.endToEndId;
  }
  get posTransactionPaymentId(): string | null {
    return this.props.posTransactionPaymentId;
  }
  get orderId(): string | null {
    return this.props.orderId;
  }
  get expiresAt(): Date {
    return this.props.expiresAt;
  }
  get paidAt(): Date | null {
    return this.props.paidAt;
  }
  get provider(): string {
    return this.props.provider;
  }
  get providerData(): Record<string, unknown> | null {
    return this.props.providerData;
  }
  get createdAt(): Date {
    return this.props.createdAt;
  }
  get updatedAt(): Date | null {
    return this.props.updatedAt;
  }

  markAsPaid(
    payerName: string,
    payerCpfCnpj: string,
    endToEndId: string,
  ): void {
    this.props.status = 'COMPLETED';
    this.props.payerName = payerName;
    this.props.payerCpfCnpj = payerCpfCnpj;
    this.props.endToEndId = endToEndId;
    this.props.paidAt = new Date();
    this.touch();
  }

  markAsExpired(): void {
    this.props.status = 'EXPIRED';
    this.touch();
  }

  markAsCancelled(): void {
    this.props.status = 'CANCELLED';
    this.touch();
  }

  private touch(): void {
    this.props.updatedAt = new Date();
  }

  static create(
    props: Optional<
      PixChargeProps,
      | 'id'
      | 'status'
      | 'payerName'
      | 'payerCpfCnpj'
      | 'endToEndId'
      | 'posTransactionPaymentId'
      | 'orderId'
      | 'paidAt'
      | 'providerData'
      | 'createdAt'
      | 'updatedAt'
    >,
    id?: UniqueEntityID,
  ): PixCharge {
    const chargeId = id ?? props.id ?? new UniqueEntityID();
    return new PixCharge(
      {
        ...props,
        id: chargeId,
        status: props.status ?? 'ACTIVE',
        payerName: props.payerName ?? null,
        payerCpfCnpj: props.payerCpfCnpj ?? null,
        endToEndId: props.endToEndId ?? null,
        posTransactionPaymentId: props.posTransactionPaymentId ?? null,
        orderId: props.orderId ?? null,
        paidAt: props.paidAt ?? null,
        providerData: props.providerData ?? null,
        createdAt: props.createdAt ?? new Date(),
        updatedAt: props.updatedAt ?? null,
      },
      chargeId,
    );
  }
}
