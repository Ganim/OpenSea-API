import { Entity } from '../domain/entities';
import { Optional } from '../domain/optional';
import { UniqueEntityID } from '../domain/unique-entity-id';

export type LandingPageStatusType = 'DRAFT' | 'PUBLISHED' | 'ARCHIVED';

export interface LandingPageProps {
  id: UniqueEntityID;
  tenantId: UniqueEntityID;
  title: string;
  slug: string;
  description?: string;
  template: string;
  content: Record<string, unknown>;
  formId?: string;
  status: LandingPageStatusType;
  isPublished: boolean;
  publishedAt?: Date;
  viewCount: number;
  createdBy: string;
  createdAt: Date;
  updatedAt?: Date;
  deletedAt?: Date;
}

export class LandingPage extends Entity<LandingPageProps> {
  get id(): UniqueEntityID {
    return this.props.id;
  }

  get tenantId(): UniqueEntityID {
    return this.props.tenantId;
  }

  get title(): string {
    return this.props.title;
  }

  set title(value: string) {
    this.props.title = value;
    this.touch();
  }

  get slug(): string {
    return this.props.slug;
  }

  set slug(value: string) {
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

  get template(): string {
    return this.props.template;
  }

  set template(value: string) {
    this.props.template = value;
    this.touch();
  }

  get content(): Record<string, unknown> {
    return this.props.content;
  }

  set content(value: Record<string, unknown>) {
    this.props.content = value;
    this.touch();
  }

  get formId(): string | undefined {
    return this.props.formId;
  }

  set formId(value: string | undefined) {
    this.props.formId = value;
    this.touch();
  }

  get status(): LandingPageStatusType {
    return this.props.status;
  }

  set status(value: LandingPageStatusType) {
    this.props.status = value;
    this.touch();
  }

  get isPublished(): boolean {
    return this.props.isPublished;
  }

  get publishedAt(): Date | undefined {
    return this.props.publishedAt;
  }

  get viewCount(): number {
    return this.props.viewCount;
  }

  get createdBy(): string {
    return this.props.createdBy;
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

  publish() {
    this.props.status = 'PUBLISHED';
    this.props.isPublished = true;
    this.props.publishedAt = new Date();
    this.touch();
  }

  unpublish() {
    this.props.status = 'DRAFT';
    this.props.isPublished = false;
    this.touch();
  }

  incrementViewCount() {
    this.props.viewCount += 1;
    this.touch();
  }

  delete() {
    this.props.deletedAt = new Date();
    this.touch();
  }

  static create(
    props: Optional<
      LandingPageProps,
      | 'id'
      | 'createdAt'
      | 'status'
      | 'isPublished'
      | 'viewCount'
      | 'template'
      | 'content'
    >,
    id?: UniqueEntityID,
  ): LandingPage {
    const landingPage = new LandingPage(
      {
        ...props,
        id: id ?? new UniqueEntityID(),
        status: props.status ?? 'DRAFT',
        isPublished: props.isPublished ?? false,
        viewCount: props.viewCount ?? 0,
        template: props.template ?? 'lead-capture',
        content: props.content ?? {},
        createdAt: props.createdAt ?? new Date(),
      },
      id,
    );

    return landingPage;
  }
}
