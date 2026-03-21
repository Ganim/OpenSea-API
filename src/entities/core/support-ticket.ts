import { Entity } from '../domain/entities';
import { Optional } from '../domain/optional';
import { UniqueEntityID } from '../domain/unique-entity-id';

export type TicketCategory =
  | 'BUG'
  | 'QUESTION'
  | 'REQUEST'
  | 'FINANCIAL'
  | 'OTHER';
export type TicketPriority = 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
export type TicketStatus =
  | 'OPEN'
  | 'IN_PROGRESS'
  | 'WAITING_CLIENT'
  | 'RESOLVED'
  | 'CLOSED';

export interface SupportTicketProps {
  id: UniqueEntityID;
  ticketNumber: number;
  tenantId: string;
  creatorId: string;
  assigneeId: string | null;
  title: string;
  category: TicketCategory;
  priority: TicketPriority;
  status: TicketStatus;
  resolvedAt: Date | null;
  closedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export class SupportTicket extends Entity<SupportTicketProps> {
  get supportTicketId(): UniqueEntityID {
    return this.props.id;
  }
  get ticketNumber(): number {
    return this.props.ticketNumber;
  }
  get tenantId(): string {
    return this.props.tenantId;
  }
  get creatorId(): string {
    return this.props.creatorId;
  }
  get assigneeId(): string | null {
    return this.props.assigneeId;
  }
  get title(): string {
    return this.props.title;
  }
  get category(): TicketCategory {
    return this.props.category;
  }
  get priority(): TicketPriority {
    return this.props.priority;
  }
  get status(): TicketStatus {
    return this.props.status;
  }
  get resolvedAt(): Date | null {
    return this.props.resolvedAt;
  }
  get closedAt(): Date | null {
    return this.props.closedAt;
  }
  get createdAt(): Date {
    return this.props.createdAt;
  }
  get updatedAt(): Date {
    return this.props.updatedAt;
  }

  set assigneeId(assigneeId: string | null) {
    this.props.assigneeId = assigneeId;
    this.touch();
  }
  set status(status: TicketStatus) {
    this.props.status = status;
    this.touch();
  }
  set priority(priority: TicketPriority) {
    this.props.priority = priority;
    this.touch();
  }
  set resolvedAt(resolvedAt: Date | null) {
    this.props.resolvedAt = resolvedAt;
    this.touch();
  }
  set closedAt(closedAt: Date | null) {
    this.props.closedAt = closedAt;
    this.touch();
  }

  get isOpen(): boolean {
    return this.status === 'OPEN';
  }
  get isResolved(): boolean {
    return this.status === 'RESOLVED';
  }
  get isClosed(): boolean {
    return this.status === 'CLOSED';
  }

  assign(assigneeId: string): void {
    this.assigneeId = assigneeId;
    if (this.status === 'OPEN') {
      this.status = 'IN_PROGRESS';
    }
  }

  resolve(): void {
    this.status = 'RESOLVED';
    this.resolvedAt = new Date();
  }

  close(): void {
    this.status = 'CLOSED';
    this.closedAt = new Date();
  }

  reopen(): void {
    this.status = 'OPEN';
    this.resolvedAt = null;
    this.closedAt = null;
  }

  private touch(): void {
    this.props.updatedAt = new Date();
  }

  static create(
    props: Optional<
      SupportTicketProps,
      | 'id'
      | 'ticketNumber'
      | 'assigneeId'
      | 'category'
      | 'priority'
      | 'status'
      | 'resolvedAt'
      | 'closedAt'
      | 'createdAt'
      | 'updatedAt'
    >,
    id?: UniqueEntityID,
  ): SupportTicket {
    const ticketId = id ?? props.id ?? new UniqueEntityID();
    return new SupportTicket(
      {
        ...props,
        id: ticketId,
        ticketNumber: props.ticketNumber ?? 0,
        assigneeId: props.assigneeId ?? null,
        category: props.category ?? 'OTHER',
        priority: props.priority ?? 'MEDIUM',
        status: props.status ?? 'OPEN',
        resolvedAt: props.resolvedAt ?? null,
        closedAt: props.closedAt ?? null,
        createdAt: props.createdAt ?? new Date(),
        updatedAt: props.updatedAt ?? new Date(),
      },
      ticketId,
    );
  }
}
