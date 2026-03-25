import { Entity } from '../domain/entities';
import { Optional } from '../domain/optional';
import { UniqueEntityID } from '../domain/unique-entity-id';

export type FiscalEventType =
  | 'AUTHORIZATION'
  | 'CANCELLATION'
  | 'CORRECTION_LETTER'
  | 'INUTILIZATION'
  | 'MANIFESTATION';

export interface FiscalDocumentEventProps {
  id: UniqueEntityID;
  fiscalDocumentId: UniqueEntityID;
  type: FiscalEventType;
  protocol?: string;
  description: string;
  xmlRequest?: string;
  xmlResponse?: string;
  success: boolean;
  errorCode?: string;
  errorMessage?: string;
  createdAt: Date;
}

export class FiscalDocumentEvent extends Entity<FiscalDocumentEventProps> {
  get id(): UniqueEntityID {
    return this.props.id;
  }

  get fiscalDocumentId(): UniqueEntityID {
    return this.props.fiscalDocumentId;
  }

  get type(): FiscalEventType {
    return this.props.type;
  }

  get protocol(): string | undefined {
    return this.props.protocol;
  }

  get description(): string {
    return this.props.description;
  }

  get xmlRequest(): string | undefined {
    return this.props.xmlRequest;
  }

  get xmlResponse(): string | undefined {
    return this.props.xmlResponse;
  }

  get success(): boolean {
    return this.props.success;
  }

  get errorCode(): string | undefined {
    return this.props.errorCode;
  }

  get errorMessage(): string | undefined {
    return this.props.errorMessage;
  }

  get createdAt(): Date {
    return this.props.createdAt;
  }

  static create(
    props: Optional<FiscalDocumentEventProps, 'id' | 'createdAt'>,
    id?: UniqueEntityID,
  ): FiscalDocumentEvent {
    return new FiscalDocumentEvent(
      {
        ...props,
        id: id ?? new UniqueEntityID(),
        createdAt: props.createdAt ?? new Date(),
      },
      id,
    );
  }
}
