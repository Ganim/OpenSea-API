import { Entity } from '../domain/entities';
import { UniqueEntityID } from '../domain/unique-entity-id';

export interface EnterpriseProps {
  legalName: string;
  cnpj: string;
  taxRegime?: string;
  phone?: string;
  address?: string;
  addressNumber?: string;
  complement?: string;
  neighborhood?: string;
  city?: string;
  state?: string;
  zipCode?: string;
  country: string;
  logoUrl?: string;
  metadata?: Record<string, unknown>;
  deletedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export class Enterprise extends Entity<EnterpriseProps> {
  get legalName(): string {
    return this.props.legalName;
  }

  get cnpj(): string {
    return this.props.cnpj;
  }

  get taxRegime(): string | undefined {
    return this.props.taxRegime;
  }

  get phone(): string | undefined {
    return this.props.phone;
  }

  get address(): string | undefined {
    return this.props.address;
  }

  get addressNumber(): string | undefined {
    return this.props.addressNumber;
  }

  get complement(): string | undefined {
    return this.props.complement;
  }

  get neighborhood(): string | undefined {
    return this.props.neighborhood;
  }

  get city(): string | undefined {
    return this.props.city;
  }

  get state(): string | undefined {
    return this.props.state;
  }

  get zipCode(): string | undefined {
    return this.props.zipCode;
  }

  get country(): string {
    return this.props.country;
  }

  get logoUrl(): string | undefined {
    return this.props.logoUrl;
  }

  get metadata(): Record<string, unknown> {
    return this.props.metadata ?? {};
  }

  get deletedAt(): Date | undefined {
    return this.props.deletedAt;
  }

  get createdAt(): Date {
    return this.props.createdAt;
  }

  get updatedAt(): Date {
    return this.props.updatedAt;
  }

  // Business methods
  isDeleted(): boolean {
    return this.deletedAt !== undefined;
  }

  isActive(): boolean {
    return !this.isDeleted();
  }

  hasCompleteAddress(): boolean {
    return !!(this.address && this.city && this.state && this.zipCode);
  }

  // Domain methods
  updateLegalName(legalName: string): void {
    if (!legalName || legalName.trim().length === 0) {
      throw new Error('Enterprise legal name cannot be empty');
    }
    this.props.legalName = legalName;
    this.props.updatedAt = new Date();
  }

  updateTaxRegime(taxRegime?: string): void {
    this.props.taxRegime = taxRegime;
    this.props.updatedAt = new Date();
  }

  updatePhone(phone?: string): void {
    this.props.phone = phone;
    this.props.updatedAt = new Date();
  }

  updateAddress(
    address?: string,
    addressNumber?: string,
    complement?: string,
    neighborhood?: string,
    city?: string,
    state?: string,
    zipCode?: string,
    country?: string,
  ): void {
    this.props.address = address;
    this.props.addressNumber = addressNumber;
    this.props.complement = complement;
    this.props.neighborhood = neighborhood;
    this.props.city = city;
    this.props.state = state;
    this.props.zipCode = zipCode;
    if (country) {
      this.props.country = country;
    }
    this.props.updatedAt = new Date();
  }

  updateLogoUrl(logoUrl?: string): void {
    this.props.logoUrl = logoUrl;
    this.props.updatedAt = new Date();
  }

  updateMetadata(metadata: Record<string, unknown>): void {
    this.props.metadata = metadata;
    this.props.updatedAt = new Date();
  }

  delete(): void {
    if (this.isDeleted()) {
      throw new Error('Enterprise is already deleted');
    }
    this.props.deletedAt = new Date();
    this.props.updatedAt = new Date();
  }

  restore(): void {
    if (!this.isDeleted()) {
      throw new Error('Enterprise is not deleted');
    }
    this.props.deletedAt = undefined;
    this.props.updatedAt = new Date();
  }

  static create(props: EnterpriseProps, id?: UniqueEntityID): Enterprise {
    return new Enterprise(props, id);
  }
}
