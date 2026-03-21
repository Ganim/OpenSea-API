import { Entity } from '../domain/entities';
import type { Optional } from '../domain/optional';
import { UniqueEntityID } from '../domain/unique-entity-id';

export interface CatalogProps {
  id: UniqueEntityID;
  tenantId: UniqueEntityID;
  name: string;
  slug?: string;
  description?: string;
  type: string;
  status: string;
  coverImageFileId?: string;
  assignedToUserId?: UniqueEntityID;
  customerId?: UniqueEntityID;
  campaignId?: UniqueEntityID;
  rules?: Record<string, unknown>;
  aiCurated: boolean;
  aiCurationConfig?: Record<string, unknown>;
  layout: string;
  showPrices: boolean;
  showStock: boolean;
  priceTableId?: UniqueEntityID;
  isPublic: boolean;
  publicUrl?: string;
  qrCodeUrl?: string;
  deletedAt?: Date;
  createdAt: Date;
  updatedAt?: Date;
}

export class Catalog extends Entity<CatalogProps> {
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

  get slug(): string | undefined {
    return this.props.slug;
  }

  set slug(value: string | undefined) {
    this.props.slug = value;
    this.touch();
  }

  get description(): string | undefined {
    return this.props.description;
  }

  set description(value: string | undefined) {
    this.props.description = value;
    this.touch();
  }

  get type(): string {
    return this.props.type;
  }

  get status(): string {
    return this.props.status;
  }

  set status(value: string) {
    this.props.status = value;
    this.touch();
  }

  get coverImageFileId(): string | undefined {
    return this.props.coverImageFileId;
  }

  set coverImageFileId(value: string | undefined) {
    this.props.coverImageFileId = value;
    this.touch();
  }

  get assignedToUserId(): UniqueEntityID | undefined {
    return this.props.assignedToUserId;
  }

  set assignedToUserId(value: UniqueEntityID | undefined) {
    this.props.assignedToUserId = value;
    this.touch();
  }

  get customerId(): UniqueEntityID | undefined {
    return this.props.customerId;
  }

  get campaignId(): UniqueEntityID | undefined {
    return this.props.campaignId;
  }

  get rules(): Record<string, unknown> | undefined {
    return this.props.rules;
  }

  set rules(value: Record<string, unknown> | undefined) {
    this.props.rules = value;
    this.touch();
  }

  get aiCurated(): boolean {
    return this.props.aiCurated;
  }

  get aiCurationConfig(): Record<string, unknown> | undefined {
    return this.props.aiCurationConfig;
  }

  get layout(): string {
    return this.props.layout;
  }

  set layout(value: string) {
    this.props.layout = value;
    this.touch();
  }

  get showPrices(): boolean {
    return this.props.showPrices;
  }

  set showPrices(value: boolean) {
    this.props.showPrices = value;
    this.touch();
  }

  get showStock(): boolean {
    return this.props.showStock;
  }

  set showStock(value: boolean) {
    this.props.showStock = value;
    this.touch();
  }

  get priceTableId(): UniqueEntityID | undefined {
    return this.props.priceTableId;
  }

  get isPublic(): boolean {
    return this.props.isPublic;
  }

  set isPublic(value: boolean) {
    this.props.isPublic = value;
    this.touch();
  }

  get publicUrl(): string | undefined {
    return this.props.publicUrl;
  }

  get qrCodeUrl(): string | undefined {
    return this.props.qrCodeUrl;
  }

  get deletedAt(): Date | undefined {
    return this.props.deletedAt;
  }

  get createdAt(): Date {
    return this.props.createdAt;
  }

  get updatedAt(): Date | undefined {
    return this.props.updatedAt;
  }

  get isDeleted(): boolean {
    return !!this.props.deletedAt;
  }

  activate(): void {
    this.props.status = 'ACTIVE';
    this.touch();
  }

  archive(): void {
    this.props.status = 'ARCHIVED';
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

  static generateSlug(name: string): string {
    return name
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');
  }

  static create(
    props: Optional<
      CatalogProps,
      | 'id'
      | 'createdAt'
      | 'status'
      | 'isPublic'
      | 'type'
      | 'layout'
      | 'showPrices'
      | 'showStock'
      | 'aiCurated'
    >,
    id?: UniqueEntityID,
  ): Catalog {
    return new Catalog(
      {
        ...props,
        id: id ?? new UniqueEntityID(),
        status: props.status ?? 'DRAFT',
        type: props.type ?? 'GENERAL',
        layout: props.layout ?? 'GRID',
        showPrices: props.showPrices ?? true,
        showStock: props.showStock ?? false,
        isPublic: props.isPublic ?? false,
        aiCurated: props.aiCurated ?? false,
        createdAt: props.createdAt ?? new Date(),
      },
      id,
    );
  }
}
