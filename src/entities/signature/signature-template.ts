import { Entity } from '../domain/entities';
import { Optional } from '../domain/optional';
import { UniqueEntityID } from '../domain/unique-entity-id';
import type { SignatureLevelValue, EnvelopeRoutingTypeValue } from './signature-envelope';

export interface SignerSlot {
  order: number;
  group: number;
  role: string;
  label: string;
  signatureLevel?: string;
}

export interface SignatureTemplateProps {
  id: UniqueEntityID;
  tenantId: UniqueEntityID;
  name: string;
  description: string | null;
  signatureLevel: SignatureLevelValue;
  routingType: EnvelopeRoutingTypeValue;
  signerSlots: SignerSlot[];
  expirationDays: number | null;
  reminderDays: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export class SignatureTemplate extends Entity<SignatureTemplateProps> {
  get templateId(): UniqueEntityID {
    return this.props.id;
  }

  get tenantId(): UniqueEntityID {
    return this.props.tenantId;
  }

  get name(): string {
    return this.props.name;
  }

  get description(): string | null {
    return this.props.description;
  }

  get signatureLevel(): SignatureLevelValue {
    return this.props.signatureLevel;
  }

  get routingType(): EnvelopeRoutingTypeValue {
    return this.props.routingType;
  }

  get signerSlots(): SignerSlot[] {
    return this.props.signerSlots;
  }

  get expirationDays(): number | null {
    return this.props.expirationDays;
  }

  get reminderDays(): number {
    return this.props.reminderDays;
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

  set name(name: string) {
    this.props.name = name;
    this.touch();
  }

  set isActive(isActive: boolean) {
    this.props.isActive = isActive;
    this.touch();
  }

  private touch(): void {
    this.props.updatedAt = new Date();
  }

  static create(
    props: Optional<
      SignatureTemplateProps,
      | 'id'
      | 'description'
      | 'expirationDays'
      | 'reminderDays'
      | 'isActive'
      | 'createdAt'
      | 'updatedAt'
    >,
    id?: UniqueEntityID,
  ): SignatureTemplate {
    return new SignatureTemplate(
      {
        ...props,
        id: id ?? props.id ?? new UniqueEntityID(),
        description: props.description ?? null,
        expirationDays: props.expirationDays ?? null,
        reminderDays: props.reminderDays ?? 3,
        isActive: props.isActive ?? true,
        createdAt: props.createdAt ?? new Date(),
        updatedAt: props.updatedAt ?? new Date(),
      },
      id,
    );
  }
}
