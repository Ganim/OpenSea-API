import { Entity } from '../domain/entities';
import { Optional } from '../domain/optional';
import { UniqueEntityID } from '../domain/unique-entity-id';

export interface ProposalItemProps {
  id: UniqueEntityID;
  proposalId: UniqueEntityID;
  description: string;
  quantity: number;
  unitPrice: number;
  total: number;
  createdAt: Date;
  updatedAt?: Date;
}

export interface ProposalAttachmentProps {
  id: UniqueEntityID;
  proposalId: UniqueEntityID;
  fileName: string;
  fileUrl: string;
  fileSize: number;
  createdAt: Date;
}

export type ProposalStatus =
  | 'DRAFT'
  | 'SENT'
  | 'UNDER_REVIEW'
  | 'APPROVED'
  | 'REJECTED'
  | 'EXPIRED';

export interface ProposalProps {
  id: UniqueEntityID;
  tenantId: UniqueEntityID;
  customerId: UniqueEntityID;
  title: string;
  description?: string;
  status: ProposalStatus;
  validUntil?: Date;
  terms?: string;
  totalValue: number;
  sentAt?: Date;
  createdBy: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt?: Date;
  deletedAt?: Date;
  items: ProposalItemProps[];
  attachments: ProposalAttachmentProps[];
}

export class Proposal extends Entity<ProposalProps> {
  get id(): UniqueEntityID {
    return this.props.id;
  }

  get tenantId(): UniqueEntityID {
    return this.props.tenantId;
  }

  get customerId(): UniqueEntityID {
    return this.props.customerId;
  }

  set customerId(value: UniqueEntityID) {
    this.props.customerId = value;
    this.touch();
  }

  get title(): string {
    return this.props.title;
  }

  set title(value: string) {
    this.props.title = value;
    this.touch();
  }

  get description(): string | undefined {
    return this.props.description;
  }

  set description(value: string | undefined) {
    this.props.description = value;
    this.touch();
  }

  get status(): ProposalStatus {
    return this.props.status;
  }

  set status(value: ProposalStatus) {
    this.props.status = value;
    this.touch();
  }

  get validUntil(): Date | undefined {
    return this.props.validUntil;
  }

  set validUntil(value: Date | undefined) {
    this.props.validUntil = value;
    this.touch();
  }

  get terms(): string | undefined {
    return this.props.terms;
  }

  set terms(value: string | undefined) {
    this.props.terms = value;
    this.touch();
  }

  get totalValue(): number {
    return this.props.totalValue;
  }

  set totalValue(value: number) {
    this.props.totalValue = value;
    this.touch();
  }

  get sentAt(): Date | undefined {
    return this.props.sentAt;
  }

  set sentAt(value: Date | undefined) {
    this.props.sentAt = value;
    this.touch();
  }

  get createdBy(): string {
    return this.props.createdBy;
  }

  get isActive(): boolean {
    return this.props.isActive;
  }

  set isActive(value: boolean) {
    this.props.isActive = value;
    this.touch();
  }

  get createdAt(): Date {
    return this.props.createdAt;
  }

  get updatedAt(): Date | undefined {
    return this.props.updatedAt;
  }

  get deletedAt(): Date | undefined {
    return this.props.deletedAt;
  }

  get items(): ProposalItemProps[] {
    return this.props.items;
  }

  set items(value: ProposalItemProps[]) {
    this.props.items = value;
    this.touch();
  }

  get attachments(): ProposalAttachmentProps[] {
    return this.props.attachments;
  }

  set attachments(value: ProposalAttachmentProps[]) {
    this.props.attachments = value;
    this.touch();
  }

  get isDeleted(): boolean {
    return !!this.props.deletedAt;
  }

  private touch() {
    this.props.updatedAt = new Date();
  }

  delete() {
    this.props.deletedAt = new Date();
    this.props.isActive = false;
    this.touch();
  }

  restore() {
    this.props.deletedAt = undefined;
    this.props.isActive = true;
    this.touch();
  }

  static create(
    props: Optional<
      ProposalProps,
      'id' | 'isActive' | 'createdAt' | 'status' | 'totalValue' | 'items' | 'attachments'
    >,
    id?: UniqueEntityID,
  ): Proposal {
    const proposal = new Proposal(
      {
        ...props,
        id: id ?? new UniqueEntityID(),
        isActive: props.isActive ?? true,
        createdAt: props.createdAt ?? new Date(),
        status: props.status ?? 'DRAFT',
        totalValue: props.totalValue ?? 0,
        items: props.items ?? [],
        attachments: props.attachments ?? [],
      },
      id,
    );

    return proposal;
  }
}
