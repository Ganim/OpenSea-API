import { Entity } from '../domain/entities';
import { Optional } from '../domain/optional';
import { UniqueEntityID } from '../domain/unique-entity-id';
import { EntityType } from './value-objects/entity-type';

export interface CommentProps {
  id: UniqueEntityID;
  entityType: EntityType;
  entityId: UniqueEntityID;
  userId: UniqueEntityID;
  content: string;
  parentCommentId?: UniqueEntityID;
  createdAt: Date;
  updatedAt?: Date;
  deletedAt?: Date;
}

export class Comment extends Entity<CommentProps> {
  get id(): UniqueEntityID {
    return this.props.id;
  }

  get entityType(): EntityType {
    return this.props.entityType;
  }

  get entityId(): UniqueEntityID {
    return this.props.entityId;
  }

  get userId(): UniqueEntityID {
    return this.props.userId;
  }

  get content(): string {
    return this.props.content;
  }

  set content(value: string) {
    if (!value || value.trim().length === 0) {
      throw new Error('Comment content cannot be empty');
    }
    this.props.content = value;
    this.touch();
  }

  get parentCommentId(): UniqueEntityID | undefined {
    return this.props.parentCommentId;
  }

  get isReply(): boolean {
    return !!this.props.parentCommentId;
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

  get isEdited(): boolean {
    return !!this.props.updatedAt;
  }

  private touch() {
    this.props.updatedAt = new Date();
  }

  delete() {
    this.props.deletedAt = new Date();
    this.touch();
  }

  restore() {
    this.props.deletedAt = undefined;
    this.touch();
  }

  static create(
    props: Optional<CommentProps, 'id' | 'createdAt'>,
    id?: UniqueEntityID,
  ): Comment {
    const comment = new Comment(
      {
        ...props,
        id: id ?? new UniqueEntityID(),
        createdAt: props.createdAt ?? new Date(),
      },
      id,
    );

    return comment;
  }
}
