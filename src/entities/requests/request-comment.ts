import { UniqueEntityID } from '@/entities/domain/unique-entity-id';

export interface RequestCommentProps {
  requestId: UniqueEntityID;
  authorId: UniqueEntityID;
  content: string;
  isInternal: boolean;
  createdAt: Date;
  updatedAt: Date;
  deletedAt?: Date;
}

export class RequestComment {
  private _id: UniqueEntityID;
  private props: RequestCommentProps;

  get id(): UniqueEntityID {
    return this._id;
  }

  get requestId(): UniqueEntityID {
    return this.props.requestId;
  }

  get authorId(): UniqueEntityID {
    return this.props.authorId;
  }

  get content(): string {
    return this.props.content;
  }

  get isInternal(): boolean {
    return this.props.isInternal;
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

  private constructor(props: RequestCommentProps, id?: UniqueEntityID) {
    this._id = id ?? new UniqueEntityID();
    this.props = {
      ...props,
      updatedAt: new Date(),
    };
  }

  static create(
    props: RequestCommentProps,
    id?: UniqueEntityID,
  ): RequestComment {
    return new RequestComment(props, id);
  }

  updateContent(content: string): void {
    this.props.content = content;
    this.props.updatedAt = new Date();
  }

  softDelete(): void {
    this.props.deletedAt = new Date();
    this.props.updatedAt = new Date();
  }

  isDeleted(): boolean {
    return this.props.deletedAt !== undefined;
  }

  canBeEditedBy(userId: string): boolean {
    return this.props.authorId.toString() === userId;
  }
}
