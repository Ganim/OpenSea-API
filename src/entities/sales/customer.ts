import { Entity } from '../domain/entities';
import { Optional } from '../domain/optional';
import { UniqueEntityID } from '../domain/unique-entity-id';
import { CustomerType } from './value-objects/customer-type';
import { Document } from './value-objects/document';

export interface CustomerProps {
  id: UniqueEntityID;
  tenantId: UniqueEntityID;
  name: string;
  type: CustomerType;
  document?: Document;
  email?: string;
  phone?: string;
  address?: string;
  city?: string;
  state?: string;
  zipCode?: string;
  country?: string;
  notes?: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt?: Date;
  deletedAt?: Date;
}

export class Customer extends Entity<CustomerProps> {
  get id(): UniqueEntityID {
    return this.props.id;
  }

  get tenantId(): UniqueEntityID {
    return this.props.tenantId;
  }

  get name(): string {
    return this.props.name;
  }

  set name(value: string) {
    this.props.name = value;
    this.touch();
  }

  get type(): CustomerType {
    return this.props.type;
  }

  set type(value: CustomerType) {
    this.props.type = value;
    this.touch();
  }

  get document(): Document | undefined {
    return this.props.document;
  }

  set document(value: Document | undefined) {
    this.props.document = value;
    this.touch();
  }

  get email(): string | undefined {
    return this.props.email;
  }

  set email(value: string | undefined) {
    this.props.email = value;
    this.touch();
  }

  get phone(): string | undefined {
    return this.props.phone;
  }

  set phone(value: string | undefined) {
    this.props.phone = value;
    this.touch();
  }

  get address(): string | undefined {
    return this.props.address;
  }

  set address(value: string | undefined) {
    this.props.address = value;
    this.touch();
  }

  get city(): string | undefined {
    return this.props.city;
  }

  set city(value: string | undefined) {
    this.props.city = value;
    this.touch();
  }

  get state(): string | undefined {
    return this.props.state;
  }

  set state(value: string | undefined) {
    this.props.state = value;
    this.touch();
  }

  get zipCode(): string | undefined {
    return this.props.zipCode;
  }

  set zipCode(value: string | undefined) {
    this.props.zipCode = value;
    this.touch();
  }

  get country(): string | undefined {
    return this.props.country;
  }

  set country(value: string | undefined) {
    this.props.country = value;
    this.touch();
  }

  get notes(): string | undefined {
    return this.props.notes;
  }

  set notes(value: string | undefined) {
    this.props.notes = value;
    this.touch();
  }

  get isActive(): boolean {
    return this.props.isActive;
  }

  set isActive(value: boolean) {
    this.props.isActive = value;
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

  get isDeleted(): boolean {
    return !!this.props.deletedAt;
  }

  private touch() {
    this.props.updatedAt = new Date();
  }

  delete() {
    this.props.deletedAt = new Date();
    this.props.isActive = false;
    this.touch();
  }

  restore() {
    this.props.deletedAt = undefined;
    this.props.isActive = true;
    this.touch();
  }

  static create(
    props: Optional<CustomerProps, 'id' | 'isActive' | 'createdAt'>,
    id?: UniqueEntityID,
  ): Customer {
    const customer = new Customer(
      {
        ...props,
        id: id ?? new UniqueEntityID(),
        isActive: props.isActive ?? true,
        createdAt: props.createdAt ?? new Date(),
      },
      id,
    );

    return customer;
  }
}
