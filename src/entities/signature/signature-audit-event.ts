import { Entity } from '../domain/entities';
import { Optional } from '../domain/optional';
import { UniqueEntityID } from '../domain/unique-entity-id';

export type SignatureAuditTypeValue =
  | 'CREATED'
  | 'SENT'
  | 'VIEWED'
  | 'SIGNED'
  | 'REJECTED'
  | 'REMINDED'
  | 'EXPIRED'
  | 'CANCELLED'
  | 'DOWNLOADED'
  | 'DOCUMENT_VERIFIED'
  | 'CERTIFICATE_VALIDATED'
  | 'OTP_SENT'
  | 'OTP_VERIFIED'
  | 'LINK_ACCESSED';

export interface SignatureAuditEventProps {
  id: UniqueEntityID;
  envelopeId: string;
  tenantId: UniqueEntityID;
  type: SignatureAuditTypeValue;
  signerId: string | null;
  description: string;
  ipAddress: string | null;
  userAgent: string | null;
  geoLatitude: number | null;
  geoLongitude: number | null;
  metadata: Record<string, unknown> | null;
  timestamp: Date;
}

export class SignatureAuditEvent extends Entity<SignatureAuditEventProps> {
  get eventId(): UniqueEntityID {
    return this.props.id;
  }

  get envelopeId(): string {
    return this.props.envelopeId;
  }

  get tenantId(): UniqueEntityID {
    return this.props.tenantId;
  }

  get type(): SignatureAuditTypeValue {
    return this.props.type;
  }

  get signerId(): string | null {
    return this.props.signerId;
  }

  get description(): string {
    return this.props.description;
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

  get metadata(): Record<string, unknown> | null {
    return this.props.metadata;
  }

  get timestamp(): Date {
    return this.props.timestamp;
  }

  static create(
    props: Optional<
      SignatureAuditEventProps,
      | 'id'
      | 'signerId'
      | 'ipAddress'
      | 'userAgent'
      | 'geoLatitude'
      | 'geoLongitude'
      | 'metadata'
      | 'timestamp'
    >,
    id?: UniqueEntityID,
  ): SignatureAuditEvent {
    return new SignatureAuditEvent(
      {
        ...props,
        id: id ?? props.id ?? new UniqueEntityID(),
        signerId: props.signerId ?? null,
        ipAddress: props.ipAddress ?? null,
        userAgent: props.userAgent ?? null,
        geoLatitude: props.geoLatitude ?? null,
        geoLongitude: props.geoLongitude ?? null,
        metadata: props.metadata ?? null,
        timestamp: props.timestamp ?? new Date(),
      },
      id,
    );
  }
}
