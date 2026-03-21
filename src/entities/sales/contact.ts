import { Entity } from '../domain/entities';
import type { Optional } from '../domain/optional';
import { UniqueEntityID } from '../domain/unique-entity-id';
import { ContactRole } from './value-objects/contact-role';
import { LifecycleStage } from './value-objects/lifecycle-stage';

export interface ContactProps {
  id: UniqueEntityID;
  tenantId: UniqueEntityID;
  customerId: UniqueEntityID;
  firstName: string;
  lastName?: string;
  email?: string;
  phone?: string;
  whatsapp?: string;
  role: ContactRole;
  jobTitle?: string;
  department?: string;
  lifecycleStage: LifecycleStage;
  leadScore: number;
  leadTemperature?: string;
  source: string;
  lastInteractionAt?: Date;
  lastChannelUsed?: string;
  socialProfiles?: Record<string, unknown>;
  tags: string[];
  customFields?: Record<string, unknown>;
  avatarUrl?: string;
  assignedToUserId?: UniqueEntityID;
  isMainContact: boolean;
  deletedAt?: Date;
  createdAt: Date;
  updatedAt?: Date;
}

export class Contact extends Entity<ContactProps> {
  get id(): UniqueEntityID {
    return this.props.id;
  }

  get tenantId(): UniqueEntityID {
    return this.props.tenantId;
  }

  get customerId(): UniqueEntityID {
    return this.props.customerId;
  }

  get firstName(): string {
    return this.props.firstName;
  }

  set firstName(value: string) {
    this.props.firstName = value;
    this.touch();
  }

  get lastName(): string | undefined {
    return this.props.lastName;
  }

  set lastName(value: string | undefined) {
    this.props.lastName = value;
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

  get whatsapp(): string | undefined {
    return this.props.whatsapp;
  }

  set whatsapp(value: string | undefined) {
    this.props.whatsapp = value;
    this.touch();
  }

  get role(): ContactRole {
    return this.props.role;
  }

  set role(value: ContactRole) {
    this.props.role = value;
    this.touch();
  }

  get jobTitle(): string | undefined {
    return this.props.jobTitle;
  }

  set jobTitle(value: string | undefined) {
    this.props.jobTitle = value;
    this.touch();
  }

  get department(): string | undefined {
    return this.props.department;
  }

  set department(value: string | undefined) {
    this.props.department = value;
    this.touch();
  }

  get lifecycleStage(): LifecycleStage {
    return this.props.lifecycleStage;
  }

  set lifecycleStage(value: LifecycleStage) {
    this.props.lifecycleStage = value;
    this.touch();
  }

  get leadScore(): number {
    return this.props.leadScore;
  }

  set leadScore(value: number) {
    this.props.leadScore = value;
    this.touch();
  }

  get leadTemperature(): string | undefined {
    return this.props.leadTemperature;
  }

  get source(): string {
    return this.props.source;
  }

  get lastInteractionAt(): Date | undefined {
    return this.props.lastInteractionAt;
  }

  get lastChannelUsed(): string | undefined {
    return this.props.lastChannelUsed;
  }

  get socialProfiles(): Record<string, unknown> | undefined {
    return this.props.socialProfiles;
  }

  get tags(): string[] {
    return this.props.tags;
  }

  get customFields(): Record<string, unknown> | undefined {
    return this.props.customFields;
  }

  get avatarUrl(): string | undefined {
    return this.props.avatarUrl;
  }

  get assignedToUserId(): UniqueEntityID | undefined {
    return this.props.assignedToUserId;
  }

  get isMainContact(): boolean {
    return this.props.isMainContact;
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

  get fullName(): string {
    return this.props.lastName
      ? `${this.props.firstName} ${this.props.lastName}`
      : this.props.firstName;
  }

  get isDeleted(): boolean {
    return !!this.props.deletedAt;
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
      ContactProps,
      'id' | 'createdAt' | 'leadScore' | 'tags' | 'isMainContact'
    >,
    id?: UniqueEntityID,
  ): Contact {
    const contact = new Contact(
      {
        ...props,
        id: id ?? new UniqueEntityID(),
        leadScore: props.leadScore ?? 0,
        tags: props.tags ?? [],
        isMainContact: props.isMainContact ?? false,
        createdAt: props.createdAt ?? new Date(),
      },
      id,
    );

    return contact;
  }
}
