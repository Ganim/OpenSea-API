import { Entity } from '../domain/entities';
import type { Optional } from '../domain/optional';
import { UniqueEntityID } from '../domain/unique-entity-id';

export type InvoiceType = 'NFE' | 'NFCE';

export type InvoiceStatus = 'PENDING' | 'ISSUED' | 'CANCELLED' | 'ERROR';

export interface InvoiceProps {
  id: UniqueEntityID;
  tenantId: UniqueEntityID;
  orderId: UniqueEntityID;
  type: InvoiceType;
  number: string;
  series: string;
  accessKey: string;
  focusIdRef?: string;
  status: InvoiceStatus;
  statusDetails?: string;
  xmlUrl?: string;
  pdfUrl?: string;
  xmlContent?: string;
  xmlContentHash?: string;
  issuedAt?: Date;
  cancelledAt?: Date;
  cancelReason?: string;
  createdAt: Date;
  updatedAt?: Date;
  deletedAt?: Date;
}

export class Invoice extends Entity<InvoiceProps> {
  get id(): UniqueEntityID {
    return this.props.id;
  }

  get tenantId(): UniqueEntityID {
    return this.props.tenantId;
  }

  get orderId(): UniqueEntityID {
    return this.props.orderId;
  }

  get type(): InvoiceType {
    return this.props.type;
  }

  get number(): string {
    return this.props.number;
  }

  set number(value: string) {
    this.props.number = value;
    this.touch();
  }

  get series(): string {
    return this.props.series;
  }

  get accessKey(): string {
    return this.props.accessKey;
  }

  set accessKey(value: string) {
    this.props.accessKey = value;
    this.touch();
  }

  get focusIdRef(): string | undefined {
    return this.props.focusIdRef;
  }

  set focusIdRef(value: string | undefined) {
    this.props.focusIdRef = value;
    this.touch();
  }

  get status(): InvoiceStatus {
    return this.props.status;
  }

  set status(value: InvoiceStatus) {
    this.props.status = value;
    this.touch();
  }

  get statusDetails(): string | undefined {
    return this.props.statusDetails;
  }

  set statusDetails(value: string | undefined) {
    this.props.statusDetails = value;
    this.touch();
  }

  get xmlUrl(): string | undefined {
    return this.props.xmlUrl;
  }

  set xmlUrl(value: string | undefined) {
    this.props.xmlUrl = value;
    this.touch();
  }

  get pdfUrl(): string | undefined {
    return this.props.pdfUrl;
  }

  set pdfUrl(value: string | undefined) {
    this.props.pdfUrl = value;
    this.touch();
  }

  get xmlContent(): string | undefined {
    return this.props.xmlContent;
  }

  set xmlContent(value: string | undefined) {
    this.props.xmlContent = value;
    this.touch();
  }

  get xmlContentHash(): string | undefined {
    return this.props.xmlContentHash;
  }

  set xmlContentHash(value: string | undefined) {
    this.props.xmlContentHash = value;
    this.touch();
  }

  get issuedAt(): Date | undefined {
    return this.props.issuedAt;
  }

  set issuedAt(value: Date | undefined) {
    this.props.issuedAt = value;
    this.touch();
  }

  get cancelledAt(): Date | undefined {
    return this.props.cancelledAt;
  }

  set cancelledAt(value: Date | undefined) {
    this.props.cancelledAt = value;
    this.touch();
  }

  get cancelReason(): string | undefined {
    return this.props.cancelReason;
  }

  set cancelReason(value: string | undefined) {
    this.props.cancelReason = value;
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

  get isDeleted(): boolean {
    return this.props.deletedAt !== undefined;
  }

  softDelete(): void {
    this.props.deletedAt = new Date();
    this.touch();
  }

  private touch(): void {
    this.props.updatedAt = new Date();
  }

  /**
   * Marca a fatura como emitida com sucesso
   */
  markAsIssued(
    accessKey: string,
    focusIdRef?: string,
    xmlUrl?: string,
    pdfUrl?: string,
  ): void {
    this.props.status = 'ISSUED';
    this.props.accessKey = accessKey;
    this.props.focusIdRef = focusIdRef;
    this.props.xmlUrl = xmlUrl;
    this.props.pdfUrl = pdfUrl;
    this.props.issuedAt = new Date();
    this.touch();
  }

  /**
   * Marca a fatura como cancelada
   */
  markAsCancelled(reason: string): void {
    if (this.props.status === 'PENDING') {
      throw new Error('Cannot cancel a pending invoice. Must be ISSUED first.');
    }
    this.props.status = 'CANCELLED';
    this.props.cancelReason = reason;
    this.props.cancelledAt = new Date();
    this.touch();
  }

  /**
   * Marca a fatura como erro
   */
  markAsError(errorDetails: string): void {
    this.props.status = 'ERROR';
    this.props.statusDetails = errorDetails;
    this.touch();
  }

  /**
   * Cria uma nova Invoice
   */
  static create(
    props: Optional<InvoiceProps, 'createdAt' | 'id'>,
    id?: UniqueEntityID,
  ): Invoice {
    const invoice = new Invoice(
      {
        ...props,
        id: props.id ?? id ?? new UniqueEntityID(),
        createdAt: props.createdAt ?? new Date(),
      },
      id ?? props.id,
    );
    return invoice;
  }
}
