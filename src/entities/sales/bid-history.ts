import { Entity } from '../domain/entities';
import type { Optional } from '../domain/optional';
import { UniqueEntityID } from '../domain/unique-entity-id';

export type BidHistoryActionType = 'BID_CREATED' | 'BID_UPDATED' | 'BID_STATUS_CHANGED' | 'BID_PROPOSAL_CREATED' | 'BID_PROPOSAL_SENT' | 'BID_DOCUMENT_UPLOADED' | 'BID_DISPUTE_ENTERED' | 'BID_PLACED' | 'BID_WON' | 'BID_LOST' | 'BID_CONTRACT_CREATED' | 'BID_EMPENHO_RECEIVED' | 'BID_ORDER_CREATED' | 'BID_AI_ANALYSIS' | 'BID_AI_DECISION' | 'BID_MANUAL_OVERRIDE';

export interface BidHistoryProps {
  id: UniqueEntityID;
  bidId: UniqueEntityID;
  tenantId: UniqueEntityID;
  action: BidHistoryActionType;
  description: string;
  metadata?: Record<string, unknown>;
  performedByUserId?: UniqueEntityID;
  performedByAi: boolean;
  isReversible: boolean;
  createdAt: Date;
}

export class BidHistory extends Entity<BidHistoryProps> {
  get bidId(): UniqueEntityID { return this.props.bidId; }
  get tenantId(): UniqueEntityID { return this.props.tenantId; }
  get action(): BidHistoryActionType { return this.props.action; }
  get description(): string { return this.props.description; }
  get metadata(): Record<string, unknown> | undefined { return this.props.metadata; }
  get performedByUserId(): UniqueEntityID | undefined { return this.props.performedByUserId; }
  get performedByAi(): boolean { return this.props.performedByAi; }
  get isReversible(): boolean { return this.props.isReversible; }
  get createdAt(): Date { return this.props.createdAt; }

  static create(props: Optional<BidHistoryProps, 'id' | 'createdAt' | 'performedByAi' | 'isReversible'>, id?: UniqueEntityID): BidHistory {
    return new BidHistory({ ...props, id: props.id ?? id ?? new UniqueEntityID(), performedByAi: props.performedByAi ?? false, isReversible: props.isReversible ?? false, createdAt: props.createdAt ?? new Date() }, id);
  }
}
