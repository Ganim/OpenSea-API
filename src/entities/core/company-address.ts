import { Entity } from '../domain/entities';
import { UniqueEntityID } from '../domain/unique-entity-id';

export type CompanyAddressType = 'FISCAL' | 'DELIVERY' | 'BILLING' | 'OTHER';

export interface CompanyAddressProps {
  companyId: UniqueEntityID;
  type: CompanyAddressType;
  street?: string;
  number?: string;
  complement?: string;
  district?: string;
  city?: string;
  state?: string;
  zip: string;
  ibgeCityCode?: string;
  countryCode: string;
  isPrimary: boolean;
  metadata: Record<string, unknown>;
  pendingIssues: string[];
  deletedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export class CompanyAddress extends Entity<CompanyAddressProps> {
  get companyId(): UniqueEntityID {
    return this.props.companyId;
  }

  get type(): CompanyAddressType {
    return this.props.type;
  }

  get street(): string | undefined {
    return this.props.street;
  }

  get number(): string | undefined {
    return this.props.number;
  }

  get complement(): string | undefined {
    return this.props.complement;
  }

  get district(): string | undefined {
    return this.props.district;
  }

  get city(): string | undefined {
    return this.props.city;
  }

  get state(): string | undefined {
    return this.props.state;
  }

  get zip(): string {
    return this.props.zip;
  }

  get ibgeCityCode(): string | undefined {
    return this.props.ibgeCityCode;
  }

  get countryCode(): string {
    return this.props.countryCode;
  }

  get isPrimary(): boolean {
    return this.props.isPrimary;
  }

  get metadata(): Record<string, unknown> {
    return this.props.metadata ?? {};
  }

  get pendingIssues(): string[] {
    return this.props.pendingIssues ?? [];
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

  isDeleted(): boolean {
    return !!this.props.deletedAt;
  }

  isActive(): boolean {
    return !this.isDeleted();
  }

  markAsPrimary(): void {
    this.props.isPrimary = true;
    this.touch();
  }

  markAsSecondary(): void {
    this.props.isPrimary = false;
    this.touch();
  }

  updateDetails(input: {
    type?: CompanyAddressType;
    street?: string | null;
    number?: string | null;
    complement?: string | null;
    district?: string | null;
    city?: string | null;
    state?: string | null;
    zip?: string | null;
    ibgeCityCode?: string | null;
    countryCode?: string | null;
    isPrimary?: boolean;
    metadata?: Record<string, unknown> | null;
    pendingIssues?: string[] | null;
  }): void {
    if (input.type !== undefined) this.props.type = input.type;
    if (input.street !== undefined) {
      this.props.street = input.street ?? undefined;
    }
    if (input.number !== undefined) {
      this.props.number = input.number ?? undefined;
    }
    if (input.complement !== undefined) {
      this.props.complement = input.complement ?? undefined;
    }
    if (input.district !== undefined) {
      this.props.district = input.district ?? undefined;
    }
    if (input.city !== undefined) this.props.city = input.city ?? undefined;
    if (input.state !== undefined) this.props.state = input.state ?? undefined;
    if (input.zip !== undefined) this.props.zip = input.zip ?? this.props.zip;
    if (input.ibgeCityCode !== undefined)
      this.props.ibgeCityCode = input.ibgeCityCode ?? undefined;
    if (input.countryCode !== undefined)
      this.props.countryCode = input.countryCode ?? this.props.countryCode;
    if (input.isPrimary !== undefined) this.props.isPrimary = input.isPrimary;
    if (input.metadata !== undefined)
      this.props.metadata = input.metadata ?? {};
    if (input.pendingIssues !== undefined)
      this.props.pendingIssues = input.pendingIssues ?? [];

    this.touch();
  }

  delete(): void {
    if (this.props.deletedAt) return;
    this.props.deletedAt = new Date();
    this.touch();
  }

  restore(): void {
    if (!this.props.deletedAt) return;
    this.props.deletedAt = undefined;
    this.touch();
  }

  private touch(): void {
    this.props.updatedAt = new Date();
  }

  static create(
    props: CompanyAddressProps,
    id?: UniqueEntityID,
  ): CompanyAddress {
    return new CompanyAddress(props, id);
  }
}
