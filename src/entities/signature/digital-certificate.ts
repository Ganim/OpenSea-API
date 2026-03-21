import { Entity } from '../domain/entities';
import { Optional } from '../domain/optional';
import { UniqueEntityID } from '../domain/unique-entity-id';

export type CertificateTypeValue =
  | 'A1'
  | 'A3'
  | 'CLOUD_NEOID'
  | 'CLOUD_BIRDID'
  | 'CLOUD_OTHER';

export type CertificateStatusValue =
  | 'ACTIVE'
  | 'EXPIRED'
  | 'REVOKED'
  | 'PENDING_ACTIVATION';

export interface DigitalCertificateProps {
  id: UniqueEntityID;
  tenantId: UniqueEntityID;
  name: string;
  type: CertificateTypeValue;
  status: CertificateStatusValue;
  subjectName: string | null;
  subjectCnpj: string | null;
  subjectCpf: string | null;
  issuerName: string | null;
  serialNumber: string | null;
  validFrom: Date | null;
  validUntil: Date | null;
  thumbprint: string | null;
  pfxFileId: string | null;
  pfxPassword: string | null;
  cloudProviderId: string | null;
  alertDaysBefore: number;
  isDefault: boolean;
  allowedModules: string[];
  lastUsedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export class DigitalCertificate extends Entity<DigitalCertificateProps> {
  get certificateId(): UniqueEntityID {
    return this.props.id;
  }

  get tenantId(): UniqueEntityID {
    return this.props.tenantId;
  }

  get name(): string {
    return this.props.name;
  }

  get type(): CertificateTypeValue {
    return this.props.type;
  }

  get status(): CertificateStatusValue {
    return this.props.status;
  }

  get subjectName(): string | null {
    return this.props.subjectName;
  }

  get subjectCnpj(): string | null {
    return this.props.subjectCnpj;
  }

  get subjectCpf(): string | null {
    return this.props.subjectCpf;
  }

  get issuerName(): string | null {
    return this.props.issuerName;
  }

  get serialNumber(): string | null {
    return this.props.serialNumber;
  }

  get validFrom(): Date | null {
    return this.props.validFrom;
  }

  get validUntil(): Date | null {
    return this.props.validUntil;
  }

  get thumbprint(): string | null {
    return this.props.thumbprint;
  }

  get pfxFileId(): string | null {
    return this.props.pfxFileId;
  }

  get pfxPassword(): string | null {
    return this.props.pfxPassword;
  }

  get cloudProviderId(): string | null {
    return this.props.cloudProviderId;
  }

  get alertDaysBefore(): number {
    return this.props.alertDaysBefore;
  }

  get isDefault(): boolean {
    return this.props.isDefault;
  }

  get allowedModules(): string[] {
    return this.props.allowedModules;
  }

  get lastUsedAt(): Date | null {
    return this.props.lastUsedAt;
  }

  get createdAt(): Date {
    return this.props.createdAt;
  }

  get updatedAt(): Date {
    return this.props.updatedAt;
  }

  get isExpired(): boolean {
    if (!this.props.validUntil) return false;
    return this.props.validUntil < new Date();
  }

  get daysUntilExpiry(): number | null {
    if (!this.props.validUntil) return null;
    const diff = this.props.validUntil.getTime() - Date.now();
    return Math.ceil(diff / (1000 * 60 * 60 * 24));
  }

  set status(status: CertificateStatusValue) {
    this.props.status = status;
    this.touch();
  }

  set lastUsedAt(date: Date | null) {
    this.props.lastUsedAt = date;
    this.touch();
  }

  private touch(): void {
    this.props.updatedAt = new Date();
  }

  static create(
    props: Optional<
      DigitalCertificateProps,
      | 'id'
      | 'status'
      | 'subjectName'
      | 'subjectCnpj'
      | 'subjectCpf'
      | 'issuerName'
      | 'serialNumber'
      | 'validFrom'
      | 'validUntil'
      | 'thumbprint'
      | 'pfxFileId'
      | 'pfxPassword'
      | 'cloudProviderId'
      | 'alertDaysBefore'
      | 'isDefault'
      | 'allowedModules'
      | 'lastUsedAt'
      | 'createdAt'
      | 'updatedAt'
    >,
    id?: UniqueEntityID,
  ): DigitalCertificate {
    return new DigitalCertificate(
      {
        ...props,
        id: id ?? props.id ?? new UniqueEntityID(),
        status: props.status ?? 'ACTIVE',
        subjectName: props.subjectName ?? null,
        subjectCnpj: props.subjectCnpj ?? null,
        subjectCpf: props.subjectCpf ?? null,
        issuerName: props.issuerName ?? null,
        serialNumber: props.serialNumber ?? null,
        validFrom: props.validFrom ?? null,
        validUntil: props.validUntil ?? null,
        thumbprint: props.thumbprint ?? null,
        pfxFileId: props.pfxFileId ?? null,
        pfxPassword: props.pfxPassword ?? null,
        cloudProviderId: props.cloudProviderId ?? null,
        alertDaysBefore: props.alertDaysBefore ?? 30,
        isDefault: props.isDefault ?? false,
        allowedModules: props.allowedModules ?? [],
        lastUsedAt: props.lastUsedAt ?? null,
        createdAt: props.createdAt ?? new Date(),
        updatedAt: props.updatedAt ?? new Date(),
      },
      id,
    );
  }
}
