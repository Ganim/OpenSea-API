import { Entity } from '../domain/entities';
import { Optional } from '../domain/optional';
import { UniqueEntityID } from '../domain/unique-entity-id';
import type { SignatureEnvelopeSigner } from './signature-envelope-signer';
import type { SignatureAuditEvent } from './signature-audit-event';

export type EnvelopeStatusValue =
  | 'DRAFT'
  | 'PENDING'
  | 'IN_PROGRESS'
  | 'COMPLETED'
  | 'CANCELLED'
  | 'EXPIRED'
  | 'REJECTED';

export type SignatureLevelValue = 'SIMPLE' | 'ADVANCED' | 'QUALIFIED';

export type EnvelopeRoutingTypeValue = 'SEQUENTIAL' | 'PARALLEL' | 'HYBRID';

export interface SignatureEnvelopeProps {
  id: UniqueEntityID;
  tenantId: UniqueEntityID;
  title: string;
  description: string | null;
  status: EnvelopeStatusValue;
  signatureLevel: SignatureLevelValue;
  minSignatureLevel: SignatureLevelValue | null;
  documentFileId: string;
  documentHash: string;
  signedFileId: string | null;
  documentType: string;
  sourceModule: string;
  sourceEntityType: string;
  sourceEntityId: string;
  routingType: EnvelopeRoutingTypeValue;
  expiresAt: Date | null;
  reminderDays: number;
  autoExpireDays: number | null;
  completedAt: Date | null;
  cancelledAt: Date | null;
  cancelReason: string | null;
  createdByUserId: string;
  tags: string[];
  metadata: Record<string, unknown> | null;
  signers?: SignatureEnvelopeSigner[];
  auditTrail?: SignatureAuditEvent[];
  deletedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export class SignatureEnvelope extends Entity<SignatureEnvelopeProps> {
  get envelopeId(): UniqueEntityID {
    return this.props.id;
  }

  get tenantId(): UniqueEntityID {
    return this.props.tenantId;
  }

  get title(): string {
    return this.props.title;
  }

  get description(): string | null {
    return this.props.description;
  }

  get status(): EnvelopeStatusValue {
    return this.props.status;
  }

  get signatureLevel(): SignatureLevelValue {
    return this.props.signatureLevel;
  }

  get minSignatureLevel(): SignatureLevelValue | null {
    return this.props.minSignatureLevel;
  }

  get documentFileId(): string {
    return this.props.documentFileId;
  }

  get documentHash(): string {
    return this.props.documentHash;
  }

  get signedFileId(): string | null {
    return this.props.signedFileId;
  }

  get documentType(): string {
    return this.props.documentType;
  }

  get sourceModule(): string {
    return this.props.sourceModule;
  }

  get sourceEntityType(): string {
    return this.props.sourceEntityType;
  }

  get sourceEntityId(): string {
    return this.props.sourceEntityId;
  }

  get routingType(): EnvelopeRoutingTypeValue {
    return this.props.routingType;
  }

  get expiresAt(): Date | null {
    return this.props.expiresAt;
  }

  get reminderDays(): number {
    return this.props.reminderDays;
  }

  get autoExpireDays(): number | null {
    return this.props.autoExpireDays;
  }

  get completedAt(): Date | null {
    return this.props.completedAt;
  }

  get cancelledAt(): Date | null {
    return this.props.cancelledAt;
  }

  get cancelReason(): string | null {
    return this.props.cancelReason;
  }

  get createdByUserId(): string {
    return this.props.createdByUserId;
  }

  get tags(): string[] {
    return this.props.tags;
  }

  get metadata(): Record<string, unknown> | null {
    return this.props.metadata;
  }

  get signers(): SignatureEnvelopeSigner[] | undefined {
    return this.props.signers;
  }

  get auditTrail(): SignatureAuditEvent[] | undefined {
    return this.props.auditTrail;
  }

  get deletedAt(): Date | null {
    return this.props.deletedAt;
  }

  get createdAt(): Date {
    return this.props.createdAt;
  }

  get updatedAt(): Date {
    return this.props.updatedAt;
  }

  get isActive(): boolean {
    return !this.props.deletedAt && !['CANCELLED', 'EXPIRED', 'REJECTED'].includes(this.props.status);
  }

  set status(status: EnvelopeStatusValue) {
    this.props.status = status;
    this.touch();
  }

  cancel(reason?: string): void {
    this.props.status = 'CANCELLED';
    this.props.cancelledAt = new Date();
    this.props.cancelReason = reason ?? null;
    this.touch();
  }

  complete(): void {
    this.props.status = 'COMPLETED';
    this.props.completedAt = new Date();
    this.touch();
  }

  private touch(): void {
    this.props.updatedAt = new Date();
  }

  static create(
    props: Optional<
      SignatureEnvelopeProps,
      | 'id'
      | 'status'
      | 'description'
      | 'minSignatureLevel'
      | 'signedFileId'
      | 'documentType'
      | 'expiresAt'
      | 'reminderDays'
      | 'autoExpireDays'
      | 'completedAt'
      | 'cancelledAt'
      | 'cancelReason'
      | 'tags'
      | 'metadata'
      | 'deletedAt'
      | 'createdAt'
      | 'updatedAt'
    >,
    id?: UniqueEntityID,
  ): SignatureEnvelope {
    return new SignatureEnvelope(
      {
        ...props,
        id: id ?? props.id ?? new UniqueEntityID(),
        status: props.status ?? 'DRAFT',
        description: props.description ?? null,
        minSignatureLevel: props.minSignatureLevel ?? null,
        signedFileId: props.signedFileId ?? null,
        documentType: props.documentType ?? 'PDF',
        expiresAt: props.expiresAt ?? null,
        reminderDays: props.reminderDays ?? 3,
        autoExpireDays: props.autoExpireDays ?? null,
        completedAt: props.completedAt ?? null,
        cancelledAt: props.cancelledAt ?? null,
        cancelReason: props.cancelReason ?? null,
        tags: props.tags ?? [],
        metadata: props.metadata ?? null,
        deletedAt: props.deletedAt ?? null,
        createdAt: props.createdAt ?? new Date(),
        updatedAt: props.updatedAt ?? new Date(),
      },
      id,
    );
  }
}
