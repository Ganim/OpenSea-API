import { Entity } from '../domain/entities';
import type { Optional } from '../domain/optional';
import { UniqueEntityID } from '../domain/unique-entity-id';

export type BidItemStatusType = 'PENDING_BID_ITEM' | 'QUOTED' | 'WON_BID_ITEM' | 'LOST_BID_ITEM' | 'DESERTED_BID_ITEM' | 'CANCELLED_BID_ITEM';
export type BidQuotaTypeEnum = 'PRINCIPAL' | 'COTA_RESERVADA' | 'EXCLUSIVO_ME_EPP';

export interface BidItemProps {
  id: UniqueEntityID;
  tenantId: UniqueEntityID;
  bidId: UniqueEntityID;
  itemNumber: number;
  lotNumber?: number;
  lotDescription?: string;
  description: string;
  quantity: number;
  unit: string;
  estimatedUnitPrice?: number;
  ourUnitPrice?: number;
  finalUnitPrice?: number;
  status: BidItemStatusType;
  variantId?: UniqueEntityID;
  matchConfidence?: number;
  quotaType?: BidQuotaTypeEnum;
  notes?: string;
  createdAt: Date;
  updatedAt?: Date;
}

export class BidItem extends Entity<BidItemProps> {
  get tenantId(): UniqueEntityID { return this.props.tenantId; }
  get bidId(): UniqueEntityID { return this.props.bidId; }
  get itemNumber(): number { return this.props.itemNumber; }
  get lotNumber(): number | undefined { return this.props.lotNumber; }
  get lotDescription(): string | undefined { return this.props.lotDescription; }
  get description(): string { return this.props.description; }
  get quantity(): number { return this.props.quantity; }
  get unit(): string { return this.props.unit; }
  get estimatedUnitPrice(): number | undefined { return this.props.estimatedUnitPrice; }
  get ourUnitPrice(): number | undefined { return this.props.ourUnitPrice; }
  set ourUnitPrice(value: number | undefined) { this.props.ourUnitPrice = value; this.touch(); }
  get finalUnitPrice(): number | undefined { return this.props.finalUnitPrice; }
  set finalUnitPrice(value: number | undefined) { this.props.finalUnitPrice = value; this.touch(); }
  get status(): BidItemStatusType { return this.props.status; }
  set status(value: BidItemStatusType) { this.props.status = value; this.touch(); }
  get variantId(): UniqueEntityID | undefined { return this.props.variantId; }
  get matchConfidence(): number | undefined { return this.props.matchConfidence; }
  get quotaType(): BidQuotaTypeEnum | undefined { return this.props.quotaType; }
  get notes(): string | undefined { return this.props.notes; }
  set notes(value: string | undefined) { this.props.notes = value; this.touch(); }
  get createdAt(): Date { return this.props.createdAt; }
  get updatedAt(): Date | undefined { return this.props.updatedAt; }
  private touch() { this.props.updatedAt = new Date(); }

  static create(props: Optional<BidItemProps, 'id' | 'createdAt' | 'status'>, id?: UniqueEntityID): BidItem {
    return new BidItem({ ...props, id: props.id ?? id ?? new UniqueEntityID(), status: props.status ?? 'PENDING_BID_ITEM', createdAt: props.createdAt ?? new Date() }, id);
  }
}
