import { Entity } from '../domain/entities';
import { Optional } from '../domain/optional';
import { UniqueEntityID } from '../domain/unique-entity-id';

export interface StorageFileVersionProps {
  id: UniqueEntityID;
  fileId: UniqueEntityID;
  version: number;
  fileKey: string;
  size: number;
  mimeType: string;
  changeNote: string | null;
  uploadedBy: string;
  createdAt: Date;
}

export class StorageFileVersion extends Entity<StorageFileVersionProps> {
  // Getters
  get versionId(): UniqueEntityID {
    return this.props.id;
  }

  get fileId(): UniqueEntityID {
    return this.props.fileId;
  }

  get version(): number {
    return this.props.version;
  }

  get fileKey(): string {
    return this.props.fileKey;
  }

  get size(): number {
    return this.props.size;
  }

  get mimeType(): string {
    return this.props.mimeType;
  }

  get changeNote(): string | null {
    return this.props.changeNote;
  }

  get uploadedBy(): string {
    return this.props.uploadedBy;
  }

  get createdAt(): Date {
    return this.props.createdAt;
  }

  // Computed Properties
  get hasChangeNote(): boolean {
    return this.props.changeNote !== null && this.props.changeNote.length > 0;
  }

  get isInitialVersion(): boolean {
    return this.props.version === 1;
  }

  static create(
    props: Optional<StorageFileVersionProps, 'id' | 'createdAt' | 'changeNote'>,
    id?: UniqueEntityID,
  ): StorageFileVersion {
    const storageFileVersion = new StorageFileVersion(
      {
        ...props,
        id: id ?? new UniqueEntityID(),
        changeNote: props.changeNote ?? null,
        createdAt: props.createdAt ?? new Date(),
      },
      id,
    );

    return storageFileVersion;
  }
}
