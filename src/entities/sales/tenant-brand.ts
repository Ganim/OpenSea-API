import { Entity } from '../domain/entities';
import type { Optional } from '../domain/optional';
import { UniqueEntityID } from '../domain/unique-entity-id';

export interface TenantBrandProps {
  id: UniqueEntityID;
  tenantId: UniqueEntityID;
  name: string;
  logoFileId?: string;
  logoIconFileId?: string;
  primaryColor: string;
  secondaryColor: string;
  accentColor: string;
  backgroundColor: string;
  textColor: string;
  fontFamily: string;
  fontHeading?: string;
  tagline?: string;
  socialLinks?: Record<string, string>;
  contactInfo?: Record<string, unknown>;
  isDefault: boolean;
  createdAt: Date;
  updatedAt?: Date;
}

export class TenantBrand extends Entity<TenantBrandProps> {
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

  get logoFileId(): string | undefined {
    return this.props.logoFileId;
  }

  set logoFileId(value: string | undefined) {
    this.props.logoFileId = value;
    this.touch();
  }

  get logoIconFileId(): string | undefined {
    return this.props.logoIconFileId;
  }

  set logoIconFileId(value: string | undefined) {
    this.props.logoIconFileId = value;
    this.touch();
  }

  get primaryColor(): string {
    return this.props.primaryColor;
  }

  set primaryColor(value: string) {
    this.props.primaryColor = value;
    this.touch();
  }

  get secondaryColor(): string {
    return this.props.secondaryColor;
  }

  set secondaryColor(value: string) {
    this.props.secondaryColor = value;
    this.touch();
  }

  get accentColor(): string {
    return this.props.accentColor;
  }

  set accentColor(value: string) {
    this.props.accentColor = value;
    this.touch();
  }

  get backgroundColor(): string {
    return this.props.backgroundColor;
  }

  set backgroundColor(value: string) {
    this.props.backgroundColor = value;
    this.touch();
  }

  get textColor(): string {
    return this.props.textColor;
  }

  set textColor(value: string) {
    this.props.textColor = value;
    this.touch();
  }

  get fontFamily(): string {
    return this.props.fontFamily;
  }

  set fontFamily(value: string) {
    this.props.fontFamily = value;
    this.touch();
  }

  get fontHeading(): string | undefined {
    return this.props.fontHeading;
  }

  set fontHeading(value: string | undefined) {
    this.props.fontHeading = value;
    this.touch();
  }

  get tagline(): string | undefined {
    return this.props.tagline;
  }

  set tagline(value: string | undefined) {
    this.props.tagline = value;
    this.touch();
  }

  get socialLinks(): Record<string, string> | undefined {
    return this.props.socialLinks;
  }

  set socialLinks(value: Record<string, string> | undefined) {
    this.props.socialLinks = value;
    this.touch();
  }

  get contactInfo(): Record<string, unknown> | undefined {
    return this.props.contactInfo;
  }

  set contactInfo(value: Record<string, unknown> | undefined) {
    this.props.contactInfo = value;
    this.touch();
  }

  get isDefault(): boolean {
    return this.props.isDefault;
  }

  get createdAt(): Date {
    return this.props.createdAt;
  }

  get updatedAt(): Date | undefined {
    return this.props.updatedAt;
  }

  private touch(): void {
    this.props.updatedAt = new Date();
  }

  static create(
    props: Optional<
      TenantBrandProps,
      | 'id'
      | 'createdAt'
      | 'name'
      | 'primaryColor'
      | 'secondaryColor'
      | 'accentColor'
      | 'backgroundColor'
      | 'textColor'
      | 'fontFamily'
      | 'isDefault'
    >,
    id?: UniqueEntityID,
  ): TenantBrand {
    return new TenantBrand(
      {
        ...props,
        id: id ?? new UniqueEntityID(),
        name: props.name ?? 'default',
        primaryColor: props.primaryColor ?? '#4F46E5',
        secondaryColor: props.secondaryColor ?? '#0F172A',
        accentColor: props.accentColor ?? '#F59E0B',
        backgroundColor: props.backgroundColor ?? '#FFFFFF',
        textColor: props.textColor ?? '#1E293B',
        fontFamily: props.fontFamily ?? 'Inter',
        isDefault: props.isDefault ?? true,
        createdAt: props.createdAt ?? new Date(),
      },
      id,
    );
  }
}
