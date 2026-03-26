import { Entity } from '../domain/entities';
import { UniqueEntityID } from '../domain/unique-entity-id';

export interface EsocialCertificateProps {
  tenantId: UniqueEntityID;
  type: string;
  serialNumber: string;
  issuer: string;
  subject: string;
  validFrom: Date;
  validUntil: Date;
  pfxData: Buffer;
  passphrase: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export class EsocialCertificate extends Entity<EsocialCertificateProps> {
  get tenantId(): UniqueEntityID {
    return this.props.tenantId;
  }

  get type(): string {
    return this.props.type;
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

  get pfxData(): Buffer {
    return this.props.pfxData;
  }

  get passphrase(): string {
    return this.props.passphrase;
  }

  get isActive(): boolean {
    return this.props.isActive;
  }

  get createdAt(): Date {
    return this.props.createdAt;
  }

  get updatedAt(): Date {
    return this.props.updatedAt;
  }

  // Domain methods
  isExpired(): boolean {
    return new Date() > this.props.validUntil;
  }

  isExpiringSoon(daysThreshold = 30): boolean {
    const thresholdDate = new Date();
    thresholdDate.setDate(thresholdDate.getDate() + daysThreshold);
    return this.props.validUntil <= thresholdDate && !this.isExpired();
  }

  daysUntilExpiry(): number {
    const now = new Date();
    const diff = this.props.validUntil.getTime() - now.getTime();
    return Math.ceil(diff / (1000 * 60 * 60 * 24));
  }

  deactivate(): void {
    this.props.isActive = false;
    this.props.updatedAt = new Date();
  }

  activate(): void {
    if (this.isExpired()) {
      throw new Error('Cannot activate an expired certificate');
    }
    this.props.isActive = true;
    this.props.updatedAt = new Date();
  }

  private constructor(props: EsocialCertificateProps, id?: UniqueEntityID) {
    super(props, id);
  }

  static create(
    props: Omit<EsocialCertificateProps, 'createdAt' | 'updatedAt'> & {
      createdAt?: Date;
      updatedAt?: Date;
    },
    id?: UniqueEntityID,
  ): EsocialCertificate {
    const now = new Date();

    return new EsocialCertificate(
      {
        ...props,
        isActive: props.isActive ?? true,
        createdAt: props.createdAt ?? now,
        updatedAt: props.updatedAt ?? now,
      },
      id,
    );
  }
}
