import { Entity } from '../domain/entities';
import type { Optional } from '../domain/optional';
import { UniqueEntityID } from '../domain/unique-entity-id';

export type BidProposalStatusType = 'DRAFT_PROPOSAL' | 'REVIEW_PROPOSAL' | 'APPROVED_PROPOSAL' | 'SENT_PROPOSAL' | 'ACCEPTED_PROPOSAL' | 'REJECTED_PROPOSAL' | 'SUPERSEDED_PROPOSAL';

export interface BidProposalProps {
  id: UniqueEntityID;
  tenantId: UniqueEntityID;
  bidId: UniqueEntityID;
  version: number;
  status: BidProposalStatusType;
  totalValue: number;
  validUntil?: Date;
  proposalFileId?: UniqueEntityID;
  sentAt?: Date;
  sentByUserId?: UniqueEntityID;
  sentByAi: boolean;
  portalConfirmation?: string;
  notes?: string;
  createdAt: Date;
  updatedAt?: Date;
}

export class BidProposal extends Entity<BidProposalProps> {
  get tenantId(): UniqueEntityID { return this.props.tenantId; }
  get bidId(): UniqueEntityID { return this.props.bidId; }
  get version(): number { return this.props.version; }
  get status(): BidProposalStatusType { return this.props.status; }
  set status(value: BidProposalStatusType) { this.props.status = value; this.touch(); }
  get totalValue(): number { return this.props.totalValue; }
  set totalValue(value: number) { this.props.totalValue = value; this.touch(); }
  get validUntil(): Date | undefined { return this.props.validUntil; }
  get proposalFileId(): UniqueEntityID | undefined { return this.props.proposalFileId; }
  get sentAt(): Date | undefined { return this.props.sentAt; }
  get sentByUserId(): UniqueEntityID | undefined { return this.props.sentByUserId; }
  get sentByAi(): boolean { return this.props.sentByAi; }
  get portalConfirmation(): string | undefined { return this.props.portalConfirmation; }
  get notes(): string | undefined { return this.props.notes; }
  set notes(value: string | undefined) { this.props.notes = value; this.touch(); }
  get createdAt(): Date { return this.props.createdAt; }
  get updatedAt(): Date | undefined { return this.props.updatedAt; }
  private touch() { this.props.updatedAt = new Date(); }

  static create(props: Optional<BidProposalProps, 'id' | 'createdAt' | 'status' | 'version' | 'sentByAi'>, id?: UniqueEntityID): BidProposal {
    return new BidProposal({ ...props, id: props.id ?? id ?? new UniqueEntityID(), status: props.status ?? 'DRAFT_PROPOSAL', version: props.version ?? 1, sentByAi: props.sentByAi ?? false, createdAt: props.createdAt ?? new Date() }, id);
  }
}
