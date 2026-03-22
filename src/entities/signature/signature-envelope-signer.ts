import { Entity } from '../domain/entities';
import { Optional } from '../domain/optional';
import { UniqueEntityID } from '../domain/unique-entity-id';
import type { SignatureLevelValue } from './signature-envelope';

export type SignerRoleValue = 'SIGNER' | 'APPROVER' | 'WITNESS' | 'REVIEWER';

export type SignerStatusValue =
  | 'PENDING'
  | 'NOTIFIED'
  | 'VIEWED'
  | 'SIGNED'
  | 'REJECTED'
  | 'EXPIRED';

export interface SignatureEnvelopeSignerProps {
  id: UniqueEntityID;
  tenantId: UniqueEntityID;
  envelopeId: string;
  order: number;
  group: number;
  role: SignerRoleValue;
  status: SignerStatusValue;
  userId: string | null;
  contactId: string | null;
  externalName: string | null;
  externalEmail: string | null;
  externalPhone: string | null;
  externalDocument: string | null;
  signatureLevel: SignatureLevelValue;
  certificateId: string | null;
  accessToken: string | null;
  accessTokenExpiresAt: Date | null;
  signedAt: Date | null;
  signatureImageFileId: string | null;
  signatureData: Record<string, unknown> | null;
  ipAddress: string | null;
  userAgent: string | null;
  geoLatitude: number | null;
  geoLongitude: number | null;
  otpVerified: boolean;
  rejectedAt: Date | null;
  rejectedReason: string | null;
  lastNotifiedAt: Date | null;
  notificationCount: number;
  createdAt: Date;
  updatedAt: Date;
}

export class SignatureEnvelopeSigner extends Entity<SignatureEnvelopeSignerProps> {
  get signerId(): UniqueEntityID {
    return this.props.id;
  }

  get tenantId(): UniqueEntityID {
    return this.props.tenantId;
  }

  get envelopeId(): string {
    return this.props.envelopeId;
  }

  get order(): number {
    return this.props.order;
  }

  get group(): number {
    return this.props.group;
  }

  get role(): SignerRoleValue {
    return this.props.role;
  }

  get status(): SignerStatusValue {
    return this.props.status;
  }

  get userId(): string | null {
    return this.props.userId;
  }

  get contactId(): string | null {
    return this.props.contactId;
  }

  get externalName(): string | null {
    return this.props.externalName;
  }

  get externalEmail(): string | null {
    return this.props.externalEmail;
  }

  get externalPhone(): string | null {
    return this.props.externalPhone;
  }

  get externalDocument(): string | null {
    return this.props.externalDocument;
  }

  get signatureLevel(): SignatureLevelValue {
    return this.props.signatureLevel;
  }

  get certificateId(): string | null {
    return this.props.certificateId;
  }

  get accessToken(): string | null {
    return this.props.accessToken;
  }

  get accessTokenExpiresAt(): Date | null {
    return this.props.accessTokenExpiresAt;
  }

  get signedAt(): Date | null {
    return this.props.signedAt;
  }

  get signatureImageFileId(): string | null {
    return this.props.signatureImageFileId;
  }

  get signatureData(): Record<string, unknown> | null {
    return this.props.signatureData;
  }

  get ipAddress(): string | null {
    return this.props.ipAddress;
  }

  get userAgent(): string | null {
    return this.props.userAgent;
  }

  get geoLatitude(): number | null {
    return this.props.geoLatitude;
  }

  get geoLongitude(): number | null {
    return this.props.geoLongitude;
  }

  get otpVerified(): boolean {
    return this.props.otpVerified;
  }

  get rejectedAt(): Date | null {
    return this.props.rejectedAt;
  }

  get rejectedReason(): string | null {
    return this.props.rejectedReason;
  }

  get lastNotifiedAt(): Date | null {
    return this.props.lastNotifiedAt;
  }

  get notificationCount(): number {
    return this.props.notificationCount;
  }

  get createdAt(): Date {
    return this.props.createdAt;
  }

  get updatedAt(): Date {
    return this.props.updatedAt;
  }

  get isSigned(): boolean {
    return this.props.status === 'SIGNED';
  }

  get isRejected(): boolean {
    return this.props.status === 'REJECTED';
  }

  get isExternal(): boolean {
    return this.props.userId === null && this.props.externalEmail !== null;
  }

  get displayName(): string {
    return this.props.externalName ?? this.props.userId ?? 'Unknown';
  }

  set status(status: SignerStatusValue) {
    this.props.status = status;
    this.touch();
  }

  sign(data: {
    ipAddress?: string;
    userAgent?: string;
    geoLatitude?: number;
    geoLongitude?: number;
    signatureData?: Record<string, unknown>;
    signatureImageFileId?: string;
  }): void {
    this.props.status = 'SIGNED';
    this.props.signedAt = new Date();
    this.props.ipAddress = data.ipAddress ?? null;
    this.props.userAgent = data.userAgent ?? null;
    this.props.geoLatitude = data.geoLatitude ?? null;
    this.props.geoLongitude = data.geoLongitude ?? null;
    this.props.signatureData = data.signatureData ?? null;
    this.props.signatureImageFileId = data.signatureImageFileId ?? null;
    this.touch();
  }

  reject(
    reason: string,
    evidence?: {
      ipAddress?: string;
      userAgent?: string;
    },
  ): void {
    this.props.status = 'REJECTED';
    this.props.rejectedAt = new Date();
    this.props.rejectedReason = reason;
    this.props.ipAddress = evidence?.ipAddress ?? null;
    this.props.userAgent = evidence?.userAgent ?? null;
    this.touch();
  }

  private touch(): void {
    this.props.updatedAt = new Date();
  }

  static create(
    props: Optional<
      SignatureEnvelopeSignerProps,
      | 'id'
      | 'order'
      | 'group'
      | 'role'
      | 'status'
      | 'userId'
      | 'contactId'
      | 'externalName'
      | 'externalEmail'
      | 'externalPhone'
      | 'externalDocument'
      | 'certificateId'
      | 'accessToken'
      | 'accessTokenExpiresAt'
      | 'signedAt'
      | 'signatureImageFileId'
      | 'signatureData'
      | 'ipAddress'
      | 'userAgent'
      | 'geoLatitude'
      | 'geoLongitude'
      | 'otpVerified'
      | 'rejectedAt'
      | 'rejectedReason'
      | 'lastNotifiedAt'
      | 'notificationCount'
      | 'createdAt'
      | 'updatedAt'
    >,
    id?: UniqueEntityID,
  ): SignatureEnvelopeSigner {
    return new SignatureEnvelopeSigner(
      {
        ...props,
        id: id ?? props.id ?? new UniqueEntityID(),
        order: props.order ?? 1,
        group: props.group ?? 1,
        role: props.role ?? 'SIGNER',
        status: props.status ?? 'PENDING',
        userId: props.userId ?? null,
        contactId: props.contactId ?? null,
        externalName: props.externalName ?? null,
        externalEmail: props.externalEmail ?? null,
        externalPhone: props.externalPhone ?? null,
        externalDocument: props.externalDocument ?? null,
        certificateId: props.certificateId ?? null,
        accessToken: props.accessToken ?? null,
        accessTokenExpiresAt: props.accessTokenExpiresAt ?? null,
        signedAt: props.signedAt ?? null,
        signatureImageFileId: props.signatureImageFileId ?? null,
        signatureData: props.signatureData ?? null,
        ipAddress: props.ipAddress ?? null,
        userAgent: props.userAgent ?? null,
        geoLatitude: props.geoLatitude ?? null,
        geoLongitude: props.geoLongitude ?? null,
        otpVerified: props.otpVerified ?? false,
        rejectedAt: props.rejectedAt ?? null,
        rejectedReason: props.rejectedReason ?? null,
        lastNotifiedAt: props.lastNotifiedAt ?? null,
        notificationCount: props.notificationCount ?? 0,
        createdAt: props.createdAt ?? new Date(),
        updatedAt: props.updatedAt ?? new Date(),
      },
      id,
    );
  }
}
