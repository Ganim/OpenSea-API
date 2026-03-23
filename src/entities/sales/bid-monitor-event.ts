import { Entity } from '../domain/entities';
import type { Optional } from '../domain/optional';
import { UniqueEntityID } from '../domain/unique-entity-id';

export type BidMonitorEventTypeEnum =
  | 'STATUS_CHANGE'
  | 'CONVOCATION'
  | 'DISQUALIFICATION'
  | 'APPEAL'
  | 'IMPUGNATION'
  | 'DEADLINE_APPROACHING'
  | 'DOCUMENT_EXPIRING'
  | 'PRICE_REGISTRATION_CALL'
  | 'CONTRACT_RENEWAL'
  | 'ADDENDUM'
  | 'AI_SUGGESTION'
  | 'PORTAL_UPDATE';

export interface BidMonitorEventProps {
  id: UniqueEntityID;
  tenantId: UniqueEntityID;
  bidId: UniqueEntityID;
  type: BidMonitorEventTypeEnum;
  description: string;
  detectedAt: Date;
  detectedByAi: boolean;
  portalData?: Record<string, unknown>;
  actionRequired: boolean;
  actionTaken?: string;
  actionTakenAt?: Date;
  actionTakenByUserId?: UniqueEntityID;
  responseDeadline?: Date;
  responseStatus?: string;
  createdAt: Date;
}

export class BidMonitorEvent extends Entity<BidMonitorEventProps> {
  get tenantId(): UniqueEntityID {
    return this.props.tenantId;
  }
  get bidId(): UniqueEntityID {
    return this.props.bidId;
  }
  get type(): BidMonitorEventTypeEnum {
    return this.props.type;
  }
  get description(): string {
    return this.props.description;
  }
  get detectedAt(): Date {
    return this.props.detectedAt;
  }
  get detectedByAi(): boolean {
    return this.props.detectedByAi;
  }
  get portalData(): Record<string, unknown> | undefined {
    return this.props.portalData;
  }
  get actionRequired(): boolean {
    return this.props.actionRequired;
  }
  get actionTaken(): string | undefined {
    return this.props.actionTaken;
  }
  get actionTakenAt(): Date | undefined {
    return this.props.actionTakenAt;
  }
  get actionTakenByUserId(): UniqueEntityID | undefined {
    return this.props.actionTakenByUserId;
  }
  get responseDeadline(): Date | undefined {
    return this.props.responseDeadline;
  }
  get responseStatus(): string | undefined {
    return this.props.responseStatus;
  }
  get createdAt(): Date {
    return this.props.createdAt;
  }

  static create(
    props: Optional<
      BidMonitorEventProps,
      'id' | 'createdAt' | 'detectedAt' | 'detectedByAi' | 'actionRequired'
    >,
    id?: UniqueEntityID,
  ): BidMonitorEvent {
    return new BidMonitorEvent(
      {
        ...props,
        id: props.id ?? id ?? new UniqueEntityID(),
        detectedAt: props.detectedAt ?? new Date(),
        detectedByAi: props.detectedByAi ?? false,
        actionRequired: props.actionRequired ?? false,
        createdAt: props.createdAt ?? new Date(),
      },
      id,
    );
  }
}
