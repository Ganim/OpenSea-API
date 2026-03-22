import { Entity } from '../domain/entities';
import type { Optional } from '../domain/optional';
import { UniqueEntityID } from '../domain/unique-entity-id';

export type CampaignStatus =
  | 'DRAFT'
  | 'ACTIVE'
  | 'SCHEDULED'
  | 'PAUSED'
  | 'ENDED';
export type CampaignType =
  | 'PERCENTAGE'
  | 'FIXED_AMOUNT'
  | 'BUY_X_GET_Y'
  | 'FREE_SHIPPING';
export type CampaignApplicableTo =
  | 'ALL'
  | 'SPECIFIC_PRODUCTS'
  | 'SPECIFIC_CATEGORIES';

export interface CampaignRuleProps {
  id: UniqueEntityID;
  campaignId: UniqueEntityID;
  field: string;
  operator: string;
  value: string;
  createdAt: Date;
}

export interface CampaignProductProps {
  id: UniqueEntityID;
  campaignId: UniqueEntityID;
  productId: UniqueEntityID;
  variantId?: UniqueEntityID;
  createdAt: Date;
}

export interface CampaignProps {
  id: UniqueEntityID;
  tenantId: UniqueEntityID;
  name: string;
  description?: string;
  type: CampaignType;
  status: CampaignStatus;
  discountValue: number;
  applicableTo: CampaignApplicableTo;
  minOrderValue?: number;
  maxDiscountAmount?: number;
  maxUsageTotal?: number;
  maxUsagePerCustomer?: number;
  currentUsageTotal: number;
  startDate?: Date;
  endDate?: Date;
  rules: CampaignRuleProps[];
  products: CampaignProductProps[];
  categoryIds: string[];
  priority: number;
  isStackable: boolean;
  createdAt: Date;
  updatedAt: Date;
  deletedAt?: Date;
}

export class Campaign extends Entity<CampaignProps> {
  get campaignId(): UniqueEntityID {
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

  get description(): string | undefined {
    return this.props.description;
  }

  set description(value: string | undefined) {
    this.props.description = value;
    this.touch();
  }

  get type(): CampaignType {
    return this.props.type;
  }

  set type(value: CampaignType) {
    this.props.type = value;
    this.touch();
  }

  get status(): CampaignStatus {
    return this.props.status;
  }

  set status(value: CampaignStatus) {
    this.props.status = value;
    this.touch();
  }

  get discountValue(): number {
    return this.props.discountValue;
  }

  set discountValue(value: number) {
    this.props.discountValue = value;
    this.touch();
  }

  get applicableTo(): CampaignApplicableTo {
    return this.props.applicableTo;
  }

  set applicableTo(value: CampaignApplicableTo) {
    this.props.applicableTo = value;
    this.touch();
  }

  get minOrderValue(): number | undefined {
    return this.props.minOrderValue;
  }

  get maxDiscountAmount(): number | undefined {
    return this.props.maxDiscountAmount;
  }

  get maxUsageTotal(): number | undefined {
    return this.props.maxUsageTotal;
  }

  get maxUsagePerCustomer(): number | undefined {
    return this.props.maxUsagePerCustomer;
  }

  get currentUsageTotal(): number {
    return this.props.currentUsageTotal;
  }

  get startDate(): Date | undefined {
    return this.props.startDate;
  }

  get endDate(): Date | undefined {
    return this.props.endDate;
  }

  get rules(): CampaignRuleProps[] {
    return this.props.rules;
  }

  get products(): CampaignProductProps[] {
    return this.props.products;
  }

  get categoryIds(): string[] {
    return this.props.categoryIds;
  }

  get priority(): number {
    return this.props.priority;
  }

  get isStackable(): boolean {
    return this.props.isStackable;
  }

  get createdAt(): Date {
    return this.props.createdAt;
  }

  get updatedAt(): Date {
    return this.props.updatedAt;
  }

  get deletedAt(): Date | undefined {
    return this.props.deletedAt;
  }

  get isDeleted(): boolean {
    return !!this.props.deletedAt;
  }

  activate(): void {
    this.props.status = 'ACTIVE';
    this.touch();
  }

  schedule(): void {
    this.props.status = 'SCHEDULED';
    this.touch();
  }

  pause(): void {
    this.props.status = 'PAUSED';
    this.touch();
  }

  end(): void {
    this.props.status = 'ENDED';
    this.touch();
  }

  incrementUsage(): void {
    this.props.currentUsageTotal += 1;
    this.touch();
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
      CampaignProps,
      | 'id'
      | 'status'
      | 'currentUsageTotal'
      | 'rules'
      | 'products'
      | 'categoryIds'
      | 'priority'
      | 'isStackable'
      | 'createdAt'
      | 'updatedAt'
    >,
    id?: UniqueEntityID,
  ): Campaign {
    const campaignId = id ?? props.id ?? new UniqueEntityID();

    const campaign = new Campaign(
      {
        ...props,
        id: campaignId,
        status: props.status ?? 'DRAFT',
        currentUsageTotal: props.currentUsageTotal ?? 0,
        rules: props.rules ?? [],
        products: props.products ?? [],
        categoryIds: props.categoryIds ?? [],
        priority: props.priority ?? 0,
        isStackable: props.isStackable ?? false,
        createdAt: props.createdAt ?? new Date(),
        updatedAt: props.updatedAt ?? new Date(),
      },
      campaignId,
    );

    return campaign;
  }
}
