import { Entity } from '../domain/entities';
import { Optional } from '../domain/optional';
import type { UniqueEntityID } from '../domain/unique-entity-id';

export interface ManufacturerProps {
  id: UniqueEntityID;
  name: string;
  country: string;
  email: string | null;
  phone: string | null;
  website: string | null;
  addressLine1: string | null;
  addressLine2: string | null;
  city: string | null;
  state: string | null;
  postalCode: string | null;
  isActive: boolean;
  rating: number | null;
  notes: string | null;
  createdAt: Date;
  updatedAt: Date;
  deletedAt: Date | null;
}

export class Manufacturer extends Entity<ManufacturerProps> {
  // Getters
  get manufacturerId(): UniqueEntityID {
    return this.props.id;
  }

  get name(): string {
    return this.props.name;
  }

  get country(): string {
    return this.props.country;
  }

  get email(): string | null {
    return this.props.email;
  }

  get phone(): string | null {
    return this.props.phone;
  }

  get website(): string | null {
    return this.props.website;
  }

  get addressLine1(): string | null {
    return this.props.addressLine1;
  }

  get addressLine2(): string | null {
    return this.props.addressLine2;
  }

  get city(): string | null {
    return this.props.city;
  }

  get state(): string | null {
    return this.props.state;
  }

  get postalCode(): string | null {
    return this.props.postalCode;
  }

  get isActive(): boolean {
    return this.props.isActive;
  }

  get rating(): number | null {
    return this.props.rating;
  }

  get notes(): string | null {
    return this.props.notes;
  }

  get createdAt(): Date {
    return this.props.createdAt;
  }

  get updatedAt(): Date {
    return this.props.updatedAt;
  }

  get deletedAt(): Date | null {
    return this.props.deletedAt;
  }

  // Setters
  set name(name: string) {
    this.props.name = name;
    this.touch();
  }

  set country(country: string) {
    this.props.country = country;
    this.touch();
  }

  set email(email: string | null) {
    this.props.email = email;
    this.touch();
  }

  set phone(phone: string | null) {
    this.props.phone = phone;
    this.touch();
  }

  set website(website: string | null) {
    this.props.website = website;
    this.touch();
  }

  set addressLine1(addressLine1: string | null) {
    this.props.addressLine1 = addressLine1;
    this.touch();
  }

  set addressLine2(addressLine2: string | null) {
    this.props.addressLine2 = addressLine2;
    this.touch();
  }

  set city(city: string | null) {
    this.props.city = city;
    this.touch();
  }

  set state(state: string | null) {
    this.props.state = state;
    this.touch();
  }

  set postalCode(postalCode: string | null) {
    this.props.postalCode = postalCode;
    this.touch();
  }

  set isActive(isActive: boolean) {
    this.props.isActive = isActive;
    this.touch();
  }

  set rating(rating: number | null) {
    if (rating !== null && (rating < 0 || rating > 5)) {
      throw new Error('Rating must be between 0 and 5');
    }
    this.props.rating = rating;
    this.touch();
  }

  set notes(notes: string | null) {
    this.props.notes = notes;
    this.touch();
  }

  set deletedAt(deletedAt: Date | null) {
    this.props.deletedAt = deletedAt;
    this.touch();
  }

  // Computed Properties
  get hasAddress(): boolean {
    return (
      this.addressLine1 !== null ||
      this.city !== null ||
      this.state !== null ||
      this.postalCode !== null
    );
  }

  get fullAddress(): string | null {
    if (!this.hasAddress) return null;

    const parts: string[] = [];
    if (this.addressLine1) parts.push(this.addressLine1);
    if (this.addressLine2) parts.push(this.addressLine2);
    if (this.city) parts.push(this.city);
    if (this.state) parts.push(this.state);
    if (this.postalCode) parts.push(this.postalCode);
    if (this.country) parts.push(this.country);

    return parts.join(', ');
  }

  get hasContactInfo(): boolean {
    return this.email !== null || this.phone !== null || this.website !== null;
  }

  get hasRating(): boolean {
    return this.rating !== null;
  }

  get isWellRated(): boolean {
    return this.rating !== null && this.rating >= 4;
  }

  get isPoorlyRated(): boolean {
    return this.rating !== null && this.rating < 3;
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

  updateAddress(address: {
    addressLine1?: string | null;
    addressLine2?: string | null;
    city?: string | null;
    state?: string | null;
    postalCode?: string | null;
  }): void {
    if (address.addressLine1 !== undefined)
      this.addressLine1 = address.addressLine1;
    if (address.addressLine2 !== undefined)
      this.addressLine2 = address.addressLine2;
    if (address.city !== undefined) this.city = address.city;
    if (address.state !== undefined) this.state = address.state;
    if (address.postalCode !== undefined) this.postalCode = address.postalCode;
  }

  updateContactInfo(contact: {
    email?: string | null;
    phone?: string | null;
    website?: string | null;
  }): void {
    if (contact.email !== undefined) this.email = contact.email;
    if (contact.phone !== undefined) this.phone = contact.phone;
    if (contact.website !== undefined) this.website = contact.website;
  }

  delete(): void {
    this.deletedAt = new Date();
  }

  restore(): void {
    this.deletedAt = null;
  }

  private touch(): void {
    this.props.updatedAt = new Date();
  }

  static create(
    props: Optional<
      ManufacturerProps,
      'id' | 'createdAt' | 'updatedAt' | 'deletedAt'
    >,
    id?: UniqueEntityID,
  ): Manufacturer {
    const manufacturer = new Manufacturer(
      {
        ...props,
        id: props.id ?? id!,
        createdAt: props.createdAt ?? new Date(),
        updatedAt: props.updatedAt ?? new Date(),
        deletedAt: props.deletedAt ?? null,
      },
      id,
    );

    return manufacturer;
  }
}
