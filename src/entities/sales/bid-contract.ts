import { Entity } from '../domain/entities';
import type { Optional } from '../domain/optional';
import { UniqueEntityID } from '../domain/unique-entity-id';

export type BidContractStatusType = 'DRAFT_CONTRACT' | 'ACTIVE_CONTRACT' | 'SUSPENDED_CONTRACT' | 'COMPLETED_CONTRACT' | 'TERMINATED_CONTRACT' | 'RENEWED_CONTRACT';

export interface BidContractProps {
  id: UniqueEntityID;
  tenantId: UniqueEntityID;
  bidId: UniqueEntityID;
  contractNumber: string;
  status: BidContractStatusType;
  signedDate?: Date;
  startDate: Date;
  endDate: Date;
  totalValue: number;
  remainingValue: number;
  customerId: UniqueEntityID;
  renewalCount: number;
  maxRenewals?: number;
  renewalDeadline?: Date;
  deliveryAddresses?: Record<string, unknown>;
  contractFileId?: UniqueEntityID;
  notes?: string;
  deletedAt?: Date;
  createdAt: Date;
  updatedAt?: Date;
}

export class BidContract extends Entity<BidContractProps> {
  get tenantId(): UniqueEntityID { return this.props.tenantId; }
  get bidId(): UniqueEntityID { return this.props.bidId; }
  get contractNumber(): string { return this.props.contractNumber; }
  get status(): BidContractStatusType { return this.props.status; }
  set status(value: BidContractStatusType) { this.props.status = value; this.touch(); }
  get signedDate(): Date | undefined { return this.props.signedDate; }
  get startDate(): Date { return this.props.startDate; }
  get endDate(): Date { return this.props.endDate; }
  get totalValue(): number { return this.props.totalValue; }
  get remainingValue(): number { return this.props.remainingValue; }
  set remainingValue(value: number) { this.props.remainingValue = value; this.touch(); }
  get customerId(): UniqueEntityID { return this.props.customerId; }
  get renewalCount(): number { return this.props.renewalCount; }
  get maxRenewals(): number | undefined { return this.props.maxRenewals; }
  get renewalDeadline(): Date | undefined { return this.props.renewalDeadline; }
  get deliveryAddresses(): Record<string, unknown> | undefined { return this.props.deliveryAddresses; }
  get contractFileId(): UniqueEntityID | undefined { return this.props.contractFileId; }
  get notes(): string | undefined { return this.props.notes; }
  set notes(value: string | undefined) { this.props.notes = value; this.touch(); }
  get deletedAt(): Date | undefined { return this.props.deletedAt; }
  get isDeleted(): boolean { return !!this.props.deletedAt; }
  get createdAt(): Date { return this.props.createdAt; }
  get updatedAt(): Date | undefined { return this.props.updatedAt; }

  delete() { this.props.deletedAt = new Date(); }
  private touch() { this.props.updatedAt = new Date(); }

  static create(props: Optional<BidContractProps, 'id' | 'createdAt' | 'status' | 'renewalCount'>, id?: UniqueEntityID): BidContract {
    return new BidContract({ ...props, id: props.id ?? id ?? new UniqueEntityID(), status: props.status ?? 'DRAFT_CONTRACT', renewalCount: props.renewalCount ?? 0, createdAt: props.createdAt ?? new Date() }, id);
  }
}
