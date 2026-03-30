import { Entity } from '../domain/entities';
import { UniqueEntityID } from '../domain/unique-entity-id';

export interface SurveyProps {
  tenantId: UniqueEntityID;
  title: string;
  description?: string;
  type: string;
  status: string;
  isAnonymous: boolean;
  startDate: Date;
  endDate: Date;
  createdBy: UniqueEntityID;
  createdAt: Date;
  updatedAt: Date;
}

export class Survey extends Entity<SurveyProps> {
  get tenantId(): UniqueEntityID {
    return this.props.tenantId;
  }

  get title(): string {
    return this.props.title;
  }

  get description(): string | undefined {
    return this.props.description;
  }

  get type(): string {
    return this.props.type;
  }

  get status(): string {
    return this.props.status;
  }

  get isAnonymous(): boolean {
    return this.props.isAnonymous;
  }

  get startDate(): Date {
    return this.props.startDate;
  }

  get endDate(): Date {
    return this.props.endDate;
  }

  get createdBy(): UniqueEntityID {
    return this.props.createdBy;
  }

  get createdAt(): Date {
    return this.props.createdAt;
  }

  get updatedAt(): Date {
    return this.props.updatedAt;
  }

  isDraft(): boolean {
    return this.props.status === 'DRAFT';
  }

  isActive(): boolean {
    return this.props.status === 'ACTIVE';
  }

  isClosed(): boolean {
    return this.props.status === 'CLOSED';
  }

  activate(): void {
    if (!this.isDraft()) {
      throw new Error('Only draft surveys can be activated');
    }
    this.props.status = 'ACTIVE';
    this.props.updatedAt = new Date();
  }

  close(): void {
    if (!this.isActive()) {
      throw new Error('Only active surveys can be closed');
    }
    this.props.status = 'CLOSED';
    this.props.updatedAt = new Date();
  }

  archive(): void {
    this.props.status = 'ARCHIVED';
    this.props.updatedAt = new Date();
  }

  updateTitle(title: string): void {
    this.props.title = title;
    this.props.updatedAt = new Date();
  }

  updateDescription(description: string): void {
    this.props.description = description;
    this.props.updatedAt = new Date();
  }

  private constructor(props: SurveyProps, id?: UniqueEntityID) {
    super(props, id);
  }

  static create(
    props: Omit<SurveyProps, 'createdAt' | 'updatedAt'> & {
      createdAt?: Date;
      updatedAt?: Date;
    },
    id?: UniqueEntityID,
  ): Survey {
    const now = new Date();

    return new Survey(
      {
        ...props,
        status: props.status ?? 'DRAFT',
        isAnonymous: props.isAnonymous ?? false,
        createdAt: props.createdAt ?? now,
        updatedAt: props.updatedAt ?? now,
      },
      id,
    );
  }
}
