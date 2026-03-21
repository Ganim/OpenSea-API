import { Entity } from '../domain/entities';
import type { Optional } from '../domain/optional';
import { UniqueEntityID } from '../domain/unique-entity-id';

export interface GeneratedContentProps {
  id: UniqueEntityID;
  tenantId: UniqueEntityID;
  type: string;
  channel?: string;
  status: string;
  title?: string;
  caption?: string;
  hashtags: string[];
  templateId?: string;
  brandId?: string;
  fileId?: string;
  thumbnailFileId?: string;
  variantIds: string[];
  campaignId?: string;
  catalogId?: string;
  aiGenerated: boolean;
  aiPrompt?: string;
  aiModel?: string;
  publishedAt?: Date;
  publishedTo?: string;
  scheduledAt?: Date;
  approvedByUserId?: string;
  approvedAt?: Date;
  views: number;
  clicks: number;
  shares: number;
  engagement?: number;
  deletedAt?: Date;
  createdAt: Date;
  updatedAt?: Date;
}

export class GeneratedContent extends Entity<GeneratedContentProps> {
  get id(): UniqueEntityID {
    return this.props.id;
  }

  get tenantId(): UniqueEntityID {
    return this.props.tenantId;
  }

  get type(): string {
    return this.props.type;
  }

  get channel(): string | undefined {
    return this.props.channel;
  }

  get status(): string {
    return this.props.status;
  }

  set status(value: string) {
    this.props.status = value;
    this.touch();
  }

  get title(): string | undefined {
    return this.props.title;
  }

  set title(value: string | undefined) {
    this.props.title = value;
    this.touch();
  }

  get caption(): string | undefined {
    return this.props.caption;
  }

  set caption(value: string | undefined) {
    this.props.caption = value;
    this.touch();
  }

  get hashtags(): string[] {
    return this.props.hashtags;
  }

  get templateId(): string | undefined {
    return this.props.templateId;
  }

  get brandId(): string | undefined {
    return this.props.brandId;
  }

  get fileId(): string | undefined {
    return this.props.fileId;
  }

  get thumbnailFileId(): string | undefined {
    return this.props.thumbnailFileId;
  }

  get variantIds(): string[] {
    return this.props.variantIds;
  }

  get campaignId(): string | undefined {
    return this.props.campaignId;
  }

  get catalogId(): string | undefined {
    return this.props.catalogId;
  }

  get aiGenerated(): boolean {
    return this.props.aiGenerated;
  }

  get aiPrompt(): string | undefined {
    return this.props.aiPrompt;
  }

  get aiModel(): string | undefined {
    return this.props.aiModel;
  }

  get publishedAt(): Date | undefined {
    return this.props.publishedAt;
  }

  get publishedTo(): string | undefined {
    return this.props.publishedTo;
  }

  get scheduledAt(): Date | undefined {
    return this.props.scheduledAt;
  }

  get approvedByUserId(): string | undefined {
    return this.props.approvedByUserId;
  }

  get approvedAt(): Date | undefined {
    return this.props.approvedAt;
  }

  get views(): number {
    return this.props.views;
  }

  get clicks(): number {
    return this.props.clicks;
  }

  get shares(): number {
    return this.props.shares;
  }

  get engagement(): number | undefined {
    return this.props.engagement;
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

  approve(userId: string): void {
    this.props.status = 'APPROVED';
    this.props.approvedAt = new Date();
    this.props.approvedByUserId = userId;
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
      GeneratedContentProps,
      | 'id'
      | 'createdAt'
      | 'status'
      | 'hashtags'
      | 'variantIds'
      | 'aiGenerated'
      | 'views'
      | 'clicks'
      | 'shares'
    >,
    id?: UniqueEntityID,
  ): GeneratedContent {
    return new GeneratedContent(
      {
        ...props,
        id: id ?? new UniqueEntityID(),
        status: props.status ?? 'DRAFT',
        hashtags: props.hashtags ?? [],
        variantIds: props.variantIds ?? [],
        aiGenerated: props.aiGenerated ?? false,
        views: props.views ?? 0,
        clicks: props.clicks ?? 0,
        shares: props.shares ?? 0,
        createdAt: props.createdAt ?? new Date(),
      },
      id,
    );
  }
}
