import { UniqueEntityID } from '@/entities/domain/unique-entity-id';

export interface RequestAttachmentProps {
  requestId: UniqueEntityID;
  fileName: string;
  filePath: string;
  fileSize: number;
  mimeType: string;
  uploadedById: UniqueEntityID;
  createdAt: Date;
}

export class RequestAttachment {
  private _id: UniqueEntityID;
  private props: RequestAttachmentProps;

  get id(): UniqueEntityID {
    return this._id;
  }

  get requestId(): UniqueEntityID {
    return this.props.requestId;
  }

  get fileName(): string {
    return this.props.fileName;
  }

  get filePath(): string {
    return this.props.filePath;
  }

  get fileSize(): number {
    return this.props.fileSize;
  }

  get mimeType(): string {
    return this.props.mimeType;
  }

  get uploadedById(): UniqueEntityID {
    return this.props.uploadedById;
  }

  get createdAt(): Date {
    return this.props.createdAt;
  }

  private constructor(props: RequestAttachmentProps, id?: UniqueEntityID) {
    this._id = id ?? new UniqueEntityID();
    this.props = props;
  }

  static create(
    props: RequestAttachmentProps,
    id?: UniqueEntityID,
  ): RequestAttachment {
    return new RequestAttachment(props, id);
  }
}
