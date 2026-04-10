import { Entity } from '../domain/entities';
import type { Optional } from '../domain/optional';
import { UniqueEntityID } from '../domain/unique-entity-id';

export type PrintJobType = 'RECEIPT' | 'LABEL' | 'REPORT' | 'DOCUMENT';

export type PrintJobStatus =
  | 'CREATED'
  | 'QUEUED'
  | 'PRINTING'
  | 'SUCCESS'
  | 'FAILED'
  | 'CANCELLED';

export interface PrintJobProps {
  id: UniqueEntityID;
  tenantId: UniqueEntityID;
  printerId: UniqueEntityID;
  orderId?: string;
  type: PrintJobType;
  status: PrintJobStatus;
  content: string;
  templateData?: Record<string, unknown>;
  agentId?: string;
  copies: number;
  printerName?: string;
  labelData?: Record<string, unknown>;
  startedAt?: Date;
  errorMessage?: string;
  retryCount: number;
  maxRetries: number;
  createdAt: Date;
  completedAt?: Date;
  updatedAt?: Date;
}

export class PrintJob extends Entity<PrintJobProps> {
  get tenantId() {
    return this.props.tenantId;
  }

  get printerId() {
    return this.props.printerId;
  }

  get orderId() {
    return this.props.orderId;
  }

  get type() {
    return this.props.type;
  }

  get status() {
    return this.props.status;
  }

  set status(value: PrintJobStatus) {
    this.props.status = value;
    if (value === 'SUCCESS' || value === 'FAILED' || value === 'CANCELLED') {
      this.props.completedAt = new Date();
    }
    this.touch();
  }

  get content() {
    return this.props.content;
  }

  get templateData() {
    return this.props.templateData;
  }

  get agentId() {
    return this.props.agentId;
  }

  set agentId(value: string | undefined) {
    this.props.agentId = value;
    this.touch();
  }

  get copies() {
    return this.props.copies;
  }

  set copies(value: number) {
    this.props.copies = value;
    this.touch();
  }

  get printerName() {
    return this.props.printerName;
  }

  set printerName(value: string | undefined) {
    this.props.printerName = value;
    this.touch();
  }

  get labelData() {
    return this.props.labelData;
  }

  set labelData(value: Record<string, unknown> | undefined) {
    this.props.labelData = value;
    this.touch();
  }

  get startedAt() {
    return this.props.startedAt;
  }

  set startedAt(value: Date | undefined) {
    this.props.startedAt = value;
    this.touch();
  }

  get errorMessage() {
    return this.props.errorMessage;
  }

  set errorMessage(value: string | undefined) {
    this.props.errorMessage = value;
    this.touch();
  }

  get retryCount() {
    return this.props.retryCount;
  }

  set retryCount(value: number) {
    this.props.retryCount = value;
    this.touch();
  }

  get maxRetries() {
    return this.props.maxRetries;
  }

  get createdAt() {
    return this.props.createdAt;
  }

  get completedAt() {
    return this.props.completedAt;
  }

  get updatedAt() {
    return this.props.updatedAt;
  }

  private touch() {
    this.props.updatedAt = new Date();
  }

  static create(
    props: Optional<
      PrintJobProps,
      'id' | 'createdAt' | 'status' | 'retryCount' | 'maxRetries' | 'copies'
    >,
    id?: UniqueEntityID,
  ) {
    return new PrintJob(
      {
        ...props,
        id: props.id ?? new UniqueEntityID(),
        status: props.status ?? 'CREATED',
        retryCount: props.retryCount ?? 0,
        maxRetries: props.maxRetries ?? 3,
        copies: props.copies ?? 1,
        createdAt: props.createdAt ?? new Date(),
      },
      id ?? props.id,
    );
  }
}
