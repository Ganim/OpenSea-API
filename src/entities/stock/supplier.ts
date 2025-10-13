import { Entity } from '../domain/entities';
import { Optional } from '../domain/optional';
import { UniqueEntityID } from '../domain/unique-entity-id';
import { CNPJ } from './value-objects/cnpj';

export interface SupplierProps {
  id: UniqueEntityID;
  name: string;
  cnpj?: CNPJ;
  taxId?: string;
  contact?: string;
  email?: string;
  phone?: string;
  website?: string;
  address?: string;
  city?: string;
  state?: string;
  zipCode?: string;
  country?: string;
  paymentTerms?: string;
  rating?: number;
  isActive: boolean;
  notes?: string;
  createdAt: Date;
  updatedAt?: Date;
  deletedAt?: Date;
}

export class Supplier extends Entity<SupplierProps> {
  get id(): UniqueEntityID {
    return this.props.id;
  }

  get name(): string {
    return this.props.name;
  }

  set name(name: string) {
    this.props.name = name;
    this.touch();
  }

  get cnpj(): CNPJ | undefined {
    return this.props.cnpj;
  }

  set cnpj(cnpj: CNPJ | undefined) {
    this.props.cnpj = cnpj;
    this.touch();
  }

  get taxId(): string | undefined {
    return this.props.taxId;
  }

  set taxId(taxId: string | undefined) {
    this.props.taxId = taxId;
    this.touch();
  }

  get contact(): string | undefined {
    return this.props.contact;
  }

  set contact(contact: string | undefined) {
    this.props.contact = contact;
    this.touch();
  }

  get email(): string | undefined {
    return this.props.email;
  }

  set email(email: string | undefined) {
    this.props.email = email;
    this.touch();
  }

  get phone(): string | undefined {
    return this.props.phone;
  }

  set phone(phone: string | undefined) {
    this.props.phone = phone;
    this.touch();
  }

  get website(): string | undefined {
    return this.props.website;
  }

  set website(website: string | undefined) {
    this.props.website = website;
    this.touch();
  }

  get address(): string | undefined {
    return this.props.address;
  }

  set address(address: string | undefined) {
    this.props.address = address;
    this.touch();
  }

  get city(): string | undefined {
    return this.props.city;
  }

  set city(city: string | undefined) {
    this.props.city = city;
    this.touch();
  }

  get state(): string | undefined {
    return this.props.state;
  }

  set state(state: string | undefined) {
    this.props.state = state;
    this.touch();
  }

  get zipCode(): string | undefined {
    return this.props.zipCode;
  }

  set zipCode(zipCode: string | undefined) {
    this.props.zipCode = zipCode;
    this.touch();
  }

  get country(): string | undefined {
    return this.props.country;
  }

  set country(country: string | undefined) {
    this.props.country = country;
    this.touch();
  }

  get paymentTerms(): string | undefined {
    return this.props.paymentTerms;
  }

  set paymentTerms(terms: string | undefined) {
    this.props.paymentTerms = terms;
    this.touch();
  }

  get rating(): number | undefined {
    return this.props.rating;
  }

  set rating(rating: number | undefined) {
    if (rating !== undefined && (rating < 0 || rating > 5)) {
      throw new Error('Rating must be between 0 and 5');
    }
    this.props.rating = rating;
    this.touch();
  }

  get isActive(): boolean {
    return this.props.isActive;
  }

  set isActive(isActive: boolean) {
    this.props.isActive = isActive;
    this.touch();
  }

  get notes(): string | undefined {
    return this.props.notes;
  }

  set notes(notes: string | undefined) {
    this.props.notes = notes;
    this.touch();
  }

  get createdAt(): Date {
    return this.props.createdAt;
  }

  get updatedAt(): Date | undefined {
    return this.props.updatedAt;
  }

  get deletedAt(): Date | undefined {
    return this.props.deletedAt;
  }

  // Computed Properties
  get isDeleted(): boolean {
    return !!this.props.deletedAt;
  }

  get hasAddress(): boolean {
    return !!(
      this.props.address ||
      this.props.city ||
      this.props.state ||
      this.props.zipCode
    );
  }

  get hasContactInfo(): boolean {
    return !!(this.props.email || this.props.phone || this.props.website);
  }

  get isWellRated(): boolean {
    return this.props.rating !== undefined && this.props.rating >= 4;
  }

  get isPoorlyRated(): boolean {
    return this.props.rating !== undefined && this.props.rating < 3;
  }

  get fullAddress(): string | null {
    if (!this.hasAddress) return null;

    const parts = [
      this.props.address,
      this.props.city,
      this.props.state,
      this.props.zipCode,
      this.props.country,
    ].filter(Boolean);

    return parts.length > 0 ? parts.join(', ') : null;
  }

  // Business Methods
  activate(): void {
    this.isActive = true;
  }

  deactivate(): void {
    this.isActive = false;
  }

  updateRating(newRating: number): void {
    this.rating = newRating;
  }

  delete(): void {
    this.props.deletedAt = new Date();
    this.touch();
  }

  restore(): void {
    this.props.deletedAt = undefined;
    this.touch();
  }

  private touch(): void {
    this.props.updatedAt = new Date();
  }

  static create(
    props: Optional<
      SupplierProps,
      'id' | 'createdAt' | 'updatedAt' | 'deletedAt' | 'isActive'
    >,
    id?: UniqueEntityID,
  ): Supplier {
    const supplier = new Supplier(
      {
        ...props,
        id: id ?? new UniqueEntityID(),
        isActive: props.isActive ?? true,
        createdAt: props.createdAt ?? new Date(),
        updatedAt: props.updatedAt,
        deletedAt: props.deletedAt,
      },
      id,
    );

    return supplier;
  }
}
