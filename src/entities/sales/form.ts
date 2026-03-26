import { Entity } from '../domain/entities';
import { Optional } from '../domain/optional';
import { UniqueEntityID } from '../domain/unique-entity-id';

export interface FormProps {
  id: UniqueEntityID;
  tenantId: UniqueEntityID;
  title: string;
  description?: string;
  status: 'DRAFT' | 'PUBLISHED' | 'ARCHIVED';
  submissionCount: number;
  createdBy: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt?: Date;
  deletedAt?: Date;
}

export class Form extends Entity<FormProps> {
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

  get description(): string | undefined {
    return this.props.description;
  }

  set description(value: string | undefined) {
    this.props.description = value;
    this.touch();
  }

  get status(): 'DRAFT' | 'PUBLISHED' | 'ARCHIVED' {
    return this.props.status;
  }

  set status(value: 'DRAFT' | 'PUBLISHED' | 'ARCHIVED') {
    this.props.status = value;
    this.touch();
  }

  get submissionCount(): number {
    return this.props.submissionCount;
  }

  set submissionCount(value: number) {
    this.props.submissionCount = value;
    this.touch();
  }

  get createdBy(): string {
    return this.props.createdBy;
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

  publish() {
    this.props.status = 'PUBLISHED';
    this.touch();
  }

  unpublish() {
    this.props.status = 'DRAFT';
    this.touch();
  }

  incrementSubmissions() {
    this.props.submissionCount += 1;
    this.touch();
  }

  delete() {
    this.props.deletedAt = new Date();
    this.props.isActive = false;
    this.touch();
  }

  static create(
    props: Optional<
      FormProps,
      'id' | 'isActive' | 'createdAt' | 'status' | 'submissionCount'
    >,
    id?: UniqueEntityID,
  ): Form {
    const form = new Form(
      {
        ...props,
        id: id ?? new UniqueEntityID(),
        status: props.status ?? 'DRAFT',
        submissionCount: props.submissionCount ?? 0,
        isActive: props.isActive ?? true,
        createdAt: props.createdAt ?? new Date(),
      },
      id,
    );

    return form;
  }
}
