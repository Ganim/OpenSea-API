import { BadRequestError } from '@/@errors/use-cases/bad-request-error';
import { Entity } from '../domain/entities';
import { Optional } from '../domain/optional';
import { UniqueEntityID } from '../domain/unique-entity-id';

export type FiscalDocumentType = 'NFE' | 'NFCE' | 'NFSE';

export type FiscalDocumentStatus =
  | 'DRAFT'
  | 'PENDING'
  | 'AUTHORIZED'
  | 'CANCELLED'
  | 'DENIED'
  | 'CORRECTED'
  | 'INUTILIZED';

export type EmissionType = 'NORMAL' | 'CONTINGENCY';

export interface FiscalDocumentProps {
  id: UniqueEntityID;
  tenantId: UniqueEntityID;
  configId: UniqueEntityID;
  type: FiscalDocumentType;
  series: number;
  number: number;
  accessKey?: string;
  status: FiscalDocumentStatus;
  emissionType: EmissionType;
  recipientCnpjCpf: string;
  recipientName: string;
  recipientIe?: string;
  naturezaOperacao: string;
  cfop: string;
  totalProducts: number;
  totalDiscount: number;
  totalShipping: number;
  totalTax: number;
  totalValue: number;
  xmlSent?: string;
  xmlAuthorized?: string;
  xmlCancellation?: string;
  danfePdfUrl?: string;
  protocolNumber?: string;
  protocolDate?: Date;
  externalId?: string;
  orderId?: UniqueEntityID;
  cancelledAt?: Date;
  cancelReason?: string;
  correctionText?: string;
  additionalInfo?: string;
  createdAt: Date;
  updatedAt?: Date;
}

export class FiscalDocument extends Entity<FiscalDocumentProps> {
  get id(): UniqueEntityID {
    return this.props.id;
  }

  get tenantId(): UniqueEntityID {
    return this.props.tenantId;
  }

  get configId(): UniqueEntityID {
    return this.props.configId;
  }

  get type(): FiscalDocumentType {
    return this.props.type;
  }

  get series(): number {
    return this.props.series;
  }

  get number(): number {
    return this.props.number;
  }

  get accessKey(): string | undefined {
    return this.props.accessKey;
  }

  set accessKey(accessKey: string | undefined) {
    this.props.accessKey = accessKey;
    this.touch();
  }

  get status(): FiscalDocumentStatus {
    return this.props.status;
  }

  set status(status: FiscalDocumentStatus) {
    this.props.status = status;
    this.touch();
  }

  get emissionType(): EmissionType {
    return this.props.emissionType;
  }

  get recipientCnpjCpf(): string {
    return this.props.recipientCnpjCpf;
  }

  get recipientName(): string {
    return this.props.recipientName;
  }

  get recipientIe(): string | undefined {
    return this.props.recipientIe;
  }

  get naturezaOperacao(): string {
    return this.props.naturezaOperacao;
  }

  get cfop(): string {
    return this.props.cfop;
  }

  get totalProducts(): number {
    return this.props.totalProducts;
  }

  get totalDiscount(): number {
    return this.props.totalDiscount;
  }

  get totalShipping(): number {
    return this.props.totalShipping;
  }

  get totalTax(): number {
    return this.props.totalTax;
  }

  get totalValue(): number {
    return this.props.totalValue;
  }

  get xmlSent(): string | undefined {
    return this.props.xmlSent;
  }

  set xmlSent(xmlSent: string | undefined) {
    this.props.xmlSent = xmlSent;
    this.touch();
  }

  get xmlAuthorized(): string | undefined {
    return this.props.xmlAuthorized;
  }

  set xmlAuthorized(xmlAuthorized: string | undefined) {
    this.props.xmlAuthorized = xmlAuthorized;
    this.touch();
  }

  get xmlCancellation(): string | undefined {
    return this.props.xmlCancellation;
  }

  set xmlCancellation(xmlCancellation: string | undefined) {
    this.props.xmlCancellation = xmlCancellation;
    this.touch();
  }

  get danfePdfUrl(): string | undefined {
    return this.props.danfePdfUrl;
  }

  set danfePdfUrl(danfePdfUrl: string | undefined) {
    this.props.danfePdfUrl = danfePdfUrl;
    this.touch();
  }

  get protocolNumber(): string | undefined {
    return this.props.protocolNumber;
  }

  set protocolNumber(protocolNumber: string | undefined) {
    this.props.protocolNumber = protocolNumber;
    this.touch();
  }

  get protocolDate(): Date | undefined {
    return this.props.protocolDate;
  }

  set protocolDate(protocolDate: Date | undefined) {
    this.props.protocolDate = protocolDate;
    this.touch();
  }

  get externalId(): string | undefined {
    return this.props.externalId;
  }

  set externalId(externalId: string | undefined) {
    this.props.externalId = externalId;
    this.touch();
  }

  get orderId(): UniqueEntityID | undefined {
    return this.props.orderId;
  }

  get cancelledAt(): Date | undefined {
    return this.props.cancelledAt;
  }

  get cancelReason(): string | undefined {
    return this.props.cancelReason;
  }

  get correctionText(): string | undefined {
    return this.props.correctionText;
  }

  set correctionText(correctionText: string | undefined) {
    this.props.correctionText = correctionText;
    this.touch();
  }

  get additionalInfo(): string | undefined {
    return this.props.additionalInfo;
  }

  get createdAt(): Date {
    return this.props.createdAt;
  }

  get updatedAt(): Date | undefined {
    return this.props.updatedAt;
  }

  // Business methods

  get canBeCancelled(): boolean {
    return this.props.status === 'AUTHORIZED';
  }

  get canReceiveCorrectionLetter(): boolean {
    return this.props.status === 'AUTHORIZED' && this.props.type === 'NFE';
  }

  /**
   * Maximum cancellation window in hours depending on document type.
   * NFC-e: 24h, NF-e: 720h (30 days)
   */
  get cancellationWindowHours(): number {
    return this.props.type === 'NFCE' ? 24 : 720;
  }

  isWithinCancellationWindow(): boolean {
    if (!this.props.protocolDate) return false;

    const elapsedMs = Date.now() - this.props.protocolDate.getTime();
    const elapsedHours = elapsedMs / (1000 * 60 * 60);

    return elapsedHours <= this.cancellationWindowHours;
  }

  cancel(reason: string): void {
    if (!this.canBeCancelled) {
      throw new BadRequestError(
        `Document with status "${this.props.status}" cannot be cancelled. Only AUTHORIZED documents can be cancelled.`,
      );
    }

    if (!this.isWithinCancellationWindow()) {
      throw new BadRequestError(
        `Cancellation window of ${this.cancellationWindowHours}h has expired for this ${this.props.type}.`,
      );
    }

    this.props.status = 'CANCELLED';
    this.props.cancelledAt = new Date();
    this.props.cancelReason = reason;
    this.touch();
  }

  markAsAuthorized(
    accessKey: string,
    protocolNumber: string,
    protocolDate: Date,
    xmlAuthorized: string,
    externalId?: string,
  ): void {
    this.props.status = 'AUTHORIZED';
    this.props.accessKey = accessKey;
    this.props.protocolNumber = protocolNumber;
    this.props.protocolDate = protocolDate;
    this.props.xmlAuthorized = xmlAuthorized;
    this.props.externalId = externalId;
    this.touch();
  }

  markAsDenied(): void {
    this.props.status = 'DENIED';
    this.touch();
  }

  markAsCorrected(correctionText: string): void {
    this.props.status = 'CORRECTED';
    this.props.correctionText = correctionText;
    this.touch();
  }

  private touch(): void {
    this.props.updatedAt = new Date();
  }

  static create(
    props: Optional<
      FiscalDocumentProps,
      | 'id'
      | 'createdAt'
      | 'updatedAt'
      | 'status'
      | 'emissionType'
      | 'totalDiscount'
      | 'totalShipping'
      | 'totalTax'
    >,
    id?: UniqueEntityID,
  ): FiscalDocument {
    return new FiscalDocument(
      {
        ...props,
        id: id ?? new UniqueEntityID(),
        status: props.status ?? 'DRAFT',
        emissionType: props.emissionType ?? 'NORMAL',
        totalDiscount: props.totalDiscount ?? 0,
        totalShipping: props.totalShipping ?? 0,
        totalTax: props.totalTax ?? 0,
        createdAt: props.createdAt ?? new Date(),
        updatedAt: props.updatedAt,
      },
      id,
    );
  }
}
