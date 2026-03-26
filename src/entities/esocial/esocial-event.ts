import { Entity } from '../domain/entities';
import { UniqueEntityID } from '../domain/unique-entity-id';
import {
  EsocialEventStatus,
  isValidTransition,
  isEditableStatus,
  isTerminalStatus,
} from './value-objects/event-status';

export interface EsocialEventProps {
  tenantId: UniqueEntityID;
  eventType: string;
  status: EsocialEventStatus;
  referenceId?: string;
  referenceType?: string;
  xmlContent: string;
  xmlHash?: string;
  reviewedBy?: string;
  reviewedAt?: Date;
  reviewNotes?: string;
  approvedBy?: string;
  approvedAt?: Date;
  batchId?: UniqueEntityID;
  protocol?: string;
  receipt?: string;
  transmittedAt?: Date;
  responseAt?: Date;
  responseXml?: string;
  rejectionCode?: string;
  rejectionMessage?: string;
  retryCount: number;
  nextRetryAt?: Date;
  originalEventId?: UniqueEntityID;
  isRectification: boolean;
  deadline?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export class EsocialEvent extends Entity<EsocialEventProps> {
  get tenantId(): UniqueEntityID {
    return this.props.tenantId;
  }

  get eventType(): string {
    return this.props.eventType;
  }

  get status(): EsocialEventStatus {
    return this.props.status;
  }

  get referenceId(): string | undefined {
    return this.props.referenceId;
  }

  get referenceType(): string | undefined {
    return this.props.referenceType;
  }

  get xmlContent(): string {
    return this.props.xmlContent;
  }

  get xmlHash(): string | undefined {
    return this.props.xmlHash;
  }

  get reviewedBy(): string | undefined {
    return this.props.reviewedBy;
  }

  get reviewedAt(): Date | undefined {
    return this.props.reviewedAt;
  }

  get reviewNotes(): string | undefined {
    return this.props.reviewNotes;
  }

  get approvedBy(): string | undefined {
    return this.props.approvedBy;
  }

  get approvedAt(): Date | undefined {
    return this.props.approvedAt;
  }

  get batchId(): UniqueEntityID | undefined {
    return this.props.batchId;
  }

  get protocol(): string | undefined {
    return this.props.protocol;
  }

  get receipt(): string | undefined {
    return this.props.receipt;
  }

  get transmittedAt(): Date | undefined {
    return this.props.transmittedAt;
  }

  get responseAt(): Date | undefined {
    return this.props.responseAt;
  }

  get responseXml(): string | undefined {
    return this.props.responseXml;
  }

  get rejectionCode(): string | undefined {
    return this.props.rejectionCode;
  }

  get rejectionMessage(): string | undefined {
    return this.props.rejectionMessage;
  }

  get retryCount(): number {
    return this.props.retryCount;
  }

  get nextRetryAt(): Date | undefined {
    return this.props.nextRetryAt;
  }

  get originalEventId(): UniqueEntityID | undefined {
    return this.props.originalEventId;
  }

  get isRectification(): boolean {
    return this.props.isRectification;
  }

  get deadline(): Date | undefined {
    return this.props.deadline;
  }

  get createdAt(): Date {
    return this.props.createdAt;
  }

  get updatedAt(): Date {
    return this.props.updatedAt;
  }

  // Domain methods
  canEdit(): boolean {
    return isEditableStatus(this.props.status);
  }

  isTerminal(): boolean {
    return isTerminalStatus(this.props.status);
  }

  isOverdue(): boolean {
    if (!this.props.deadline) return false;
    return new Date() > this.props.deadline && !this.isTerminal();
  }

  transitionTo(newStatus: EsocialEventStatus): void {
    if (!isValidTransition(this.props.status, newStatus)) {
      throw new Error(
        `Invalid transition from ${this.props.status} to ${newStatus}`,
      );
    }
    this.props.status = newStatus;
    this.props.updatedAt = new Date();
  }

  updateXml(xmlContent: string, xmlHash?: string): void {
    if (!this.canEdit()) {
      throw new Error(
        `Cannot update XML for event in status ${this.props.status}`,
      );
    }
    this.props.xmlContent = xmlContent;
    this.props.xmlHash = xmlHash;
    this.props.updatedAt = new Date();
  }

  markReviewed(reviewedBy: string, notes?: string): void {
    this.transitionTo(EsocialEventStatus.REVIEWED);
    this.props.reviewedBy = reviewedBy;
    this.props.reviewedAt = new Date();
    this.props.reviewNotes = notes;
  }

  markApproved(approvedBy: string): void {
    this.transitionTo(EsocialEventStatus.APPROVED);
    this.props.approvedBy = approvedBy;
    this.props.approvedAt = new Date();
  }

  assignToBatch(batchId: UniqueEntityID): void {
    this.props.batchId = batchId;
    this.transitionTo(EsocialEventStatus.QUEUED);
  }

  markTransmitting(): void {
    this.transitionTo(EsocialEventStatus.TRANSMITTING);
    this.props.transmittedAt = new Date();
  }

  markAccepted(protocol: string, receipt: string, responseXml?: string): void {
    this.transitionTo(EsocialEventStatus.ACCEPTED);
    this.props.protocol = protocol;
    this.props.receipt = receipt;
    this.props.responseAt = new Date();
    this.props.responseXml = responseXml;
  }

  markRejected(
    rejectionCode: string,
    rejectionMessage: string,
    responseXml?: string,
  ): void {
    this.transitionTo(EsocialEventStatus.REJECTED);
    this.props.rejectionCode = rejectionCode;
    this.props.rejectionMessage = rejectionMessage;
    this.props.responseAt = new Date();
    this.props.responseXml = responseXml;
  }

  markError(reason?: string): void {
    this.transitionTo(EsocialEventStatus.ERROR);
    this.props.rejectionMessage = reason;
    this.props.retryCount += 1;
  }

  scheduleRetry(nextRetryAt: Date): void {
    this.props.nextRetryAt = nextRetryAt;
    this.props.updatedAt = new Date();
  }

  backToDraft(): void {
    this.transitionTo(EsocialEventStatus.DRAFT);
    // Clear review/approval data
    this.props.reviewedBy = undefined;
    this.props.reviewedAt = undefined;
    this.props.reviewNotes = undefined;
    this.props.approvedBy = undefined;
    this.props.approvedAt = undefined;
    this.props.batchId = undefined;
  }

  private constructor(props: EsocialEventProps, id?: UniqueEntityID) {
    super(props, id);
  }

  static create(
    props: Omit<EsocialEventProps, 'createdAt' | 'updatedAt'> & {
      createdAt?: Date;
      updatedAt?: Date;
    },
    id?: UniqueEntityID,
  ): EsocialEvent {
    const now = new Date();

    return new EsocialEvent(
      {
        ...props,
        status: props.status ?? EsocialEventStatus.DRAFT,
        retryCount: props.retryCount ?? 0,
        isRectification: props.isRectification ?? false,
        createdAt: props.createdAt ?? now,
        updatedAt: props.updatedAt ?? now,
      },
      id,
    );
  }
}
