import { Entity } from '../domain/entities';
import { Optional } from '../domain/optional';
import { UniqueEntityID } from '../domain/unique-entity-id';

export type CertificateStatus = 'ACTIVE' | 'EXPIRED' | 'REVOKED';

export interface FiscalCertificateProps {
  id: UniqueEntityID;
  tenantId: UniqueEntityID;
  pfxData: Buffer;
  pfxPassword: string;
  serialNumber: string;
  issuer: string;
  subject: string;
  validFrom: Date;
  validUntil: Date;
  status: CertificateStatus;
  createdAt: Date;
  updatedAt?: Date;
}

export class FiscalCertificate extends Entity<FiscalCertificateProps> {
  get id(): UniqueEntityID {
    return this.props.id;
  }

  get tenantId(): UniqueEntityID {
    return this.props.tenantId;
  }

  get pfxData(): Buffer {
    return this.props.pfxData;
  }

  get pfxPassword(): string {
    return this.props.pfxPassword;
  }

  get serialNumber(): string {
    return this.props.serialNumber;
  }

  get issuer(): string {
    return this.props.issuer;
  }

  get subject(): string {
    return this.props.subject;
  }

  get validFrom(): Date {
    return this.props.validFrom;
  }

  get validUntil(): Date {
    return this.props.validUntil;
  }

  get status(): CertificateStatus {
    return this.props.status;
  }

  set status(status: CertificateStatus) {
    this.props.status = status;
    this.touch();
  }

  get createdAt(): Date {
    return this.props.createdAt;
  }

  get updatedAt(): Date | undefined {
    return this.props.updatedAt;
  }

  isExpired(): boolean {
    return new Date() > this.props.validUntil;
  }

  daysUntilExpiry(): number {
    const now = new Date();
    const diffMs = this.props.validUntil.getTime() - now.getTime();
    return Math.ceil(diffMs / (1000 * 60 * 60 * 24));
  }

  private touch(): void {
    this.props.updatedAt = new Date();
  }

  static create(
    props: Optional<
      FiscalCertificateProps,
      'id' | 'createdAt' | 'updatedAt' | 'status'
    >,
    id?: UniqueEntityID,
  ): FiscalCertificate {
    return new FiscalCertificate(
      {
        ...props,
        id: id ?? new UniqueEntityID(),
        status: props.status ?? 'ACTIVE',
        createdAt: props.createdAt ?? new Date(),
        updatedAt: props.updatedAt,
      },
      id,
    );
  }
}
