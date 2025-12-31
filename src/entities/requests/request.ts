import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import type { RequestPriority } from './value-objects/request-priority';
import type { RequestStatus } from './value-objects/request-status';
import {
  canTransitionTo,
  VALID_STATUS_TRANSITIONS,
} from './value-objects/request-status';
import type { RequestTargetType } from './value-objects/request-target-type';
import type { RequestType } from './value-objects/request-type';

export interface RequestProps {
  title: string;
  description: string;
  type: RequestType;
  category?: string;
  status: RequestStatus;
  priority: RequestPriority;
  requesterId: UniqueEntityID;
  targetType: RequestTargetType;
  targetId?: string;
  assignedToId?: UniqueEntityID;
  dueDate?: Date;
  slaDeadline?: Date;
  metadata: Record<string, unknown>;
  requiresApproval: boolean;
  approvalId?: string;
  submittedAt?: Date;
  completedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
  deletedAt?: Date;
}

export class Request {
  private _id: UniqueEntityID;
  private props: RequestProps;

  get id(): UniqueEntityID {
    return this._id;
  }

  get title(): string {
    return this.props.title;
  }

  get description(): string {
    return this.props.description;
  }

  get type(): RequestType {
    return this.props.type;
  }

  get category(): string | undefined {
    return this.props.category;
  }

  get status(): RequestStatus {
    return this.props.status;
  }

  get priority(): RequestPriority {
    return this.props.priority;
  }

  get requesterId(): UniqueEntityID {
    return this.props.requesterId;
  }

  get targetType(): RequestTargetType {
    return this.props.targetType;
  }

  get targetId(): string | undefined {
    return this.props.targetId;
  }

  get assignedToId(): UniqueEntityID | undefined {
    return this.props.assignedToId;
  }

  get dueDate(): Date | undefined {
    return this.props.dueDate;
  }

  get slaDeadline(): Date | undefined {
    return this.props.slaDeadline;
  }

  get metadata(): Record<string, unknown> {
    return this.props.metadata;
  }

  get requiresApproval(): boolean {
    return this.props.requiresApproval;
  }

  get approvalId(): string | undefined {
    return this.props.approvalId;
  }

  get submittedAt(): Date | undefined {
    return this.props.submittedAt;
  }

  get completedAt(): Date | undefined {
    return this.props.completedAt;
  }

  get createdAt(): Date {
    return this.props.createdAt;
  }

  get updatedAt(): Date {
    return this.props.updatedAt;
  }

  get deletedAt(): Date | undefined {
    return this.props.deletedAt;
  }

  private constructor(props: RequestProps, id?: UniqueEntityID) {
    this._id = id ?? new UniqueEntityID();
    this.props = {
      ...props,
      updatedAt: new Date(),
    };
  }

  // Factory methods
  static create(props: RequestProps, id?: UniqueEntityID): Request {
    return new Request(props, id);
  }

  // Business methods
  changeStatus(newStatus: RequestStatus): void {
    if (!canTransitionTo(this.props.status, newStatus)) {
      throw new Error(
        `Cannot transition from ${this.props.status} to ${newStatus}`,
      );
    }
    this.props.status = newStatus;
    this.props.updatedAt = new Date();

    if (newStatus === 'COMPLETED') {
      this.props.completedAt = new Date();
    }
  }

  assign(assignedToId: UniqueEntityID): void {
    this.props.assignedToId = assignedToId;
    if (this.props.status === 'SUBMITTED') {
      this.props.status = 'IN_PROGRESS';
    }
    this.props.updatedAt = new Date();
  }

  unassign(): void {
    this.props.assignedToId = undefined;
    this.props.updatedAt = new Date();
  }

  updateTitle(title: string): void {
    this.props.title = title;
    this.props.updatedAt = new Date();
  }

  updateDescription(description: string): void {
    this.props.description = description;
    this.props.updatedAt = new Date();
  }

  updatePriority(priority: RequestPriority): void {
    this.props.priority = priority;
    this.props.updatedAt = new Date();
  }

  updateMetadata(metadata: Record<string, unknown>): void {
    this.props.metadata = { ...this.props.metadata, ...metadata };
    this.props.updatedAt = new Date();
  }

  submit(): void {
    if (this.props.status !== 'DRAFT') {
      throw new Error('Only draft requests can be submitted');
    }
    this.props.status = 'SUBMITTED';
    this.props.submittedAt = new Date();
    this.props.updatedAt = new Date();
  }

  complete(): void {
    if (
      this.props.status !== 'IN_PROGRESS' &&
      this.props.status !== 'APPROVED'
    ) {
      throw new Error('Only in-progress or approved requests can be completed');
    }
    this.props.status = 'COMPLETED';
    this.props.completedAt = new Date();
    this.props.updatedAt = new Date();
  }

  cancel(): void {
    const cancelableStatuses: RequestStatus[] = [
      'DRAFT',
      'SUBMITTED',
      'IN_PROGRESS',
      'PENDING_INFO',
    ];
    if (!cancelableStatuses.includes(this.props.status)) {
      throw new Error(`Cannot cancel request with status ${this.props.status}`);
    }
    this.props.status = 'CANCELLED';
    this.props.updatedAt = new Date();
  }

  requestInfo(): void {
    if (this.props.status !== 'IN_PROGRESS') {
      throw new Error('Can only request info from in-progress requests');
    }
    this.props.status = 'PENDING_INFO';
    this.props.updatedAt = new Date();
  }

  provideInfo(): void {
    if (this.props.status !== 'PENDING_INFO') {
      throw new Error('Can only provide info for pending-info requests');
    }
    this.props.status = 'SUBMITTED';
    this.props.updatedAt = new Date();
  }

  approve(): void {
    if (
      this.props.status !== 'SUBMITTED' &&
      this.props.status !== 'IN_PROGRESS'
    ) {
      throw new Error('Can only approve submitted or in-progress requests');
    }
    this.props.status = 'APPROVED';
    this.props.updatedAt = new Date();
  }

  reject(): void {
    if (
      this.props.status !== 'SUBMITTED' &&
      this.props.status !== 'IN_PROGRESS'
    ) {
      throw new Error('Can only reject submitted or in-progress requests');
    }
    this.props.status = 'REJECTED';
    this.props.updatedAt = new Date();
  }

  softDelete(): void {
    this.props.deletedAt = new Date();
    this.props.updatedAt = new Date();
  }

  isDeleted(): boolean {
    return this.props.deletedAt !== undefined;
  }

  canBeEditedBy(userId: string): boolean {
    return this.props.requesterId.toString() === userId;
  }

  canBeViewedBy(userId: string, hasViewAllPermission: boolean = false): boolean {
    // Criador pode ver
    if (this.props.requesterId.toString() === userId) {
      return true;
    }
    // Atribuído pode ver
    if (this.props.assignedToId?.toString() === userId) {
      return true;
    }
    // Usuário com permissão de visualizar todas as requests pode ver
    if (hasViewAllPermission) {
      return true;
    }
    return false;
  }

  getValidTransitions(): RequestStatus[] {
    return VALID_STATUS_TRANSITIONS[this.props.status];
  }
}
