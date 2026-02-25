import { Entity } from '../domain/entities';
import { Optional } from '../domain/optional';
import { UniqueEntityID } from '../domain/unique-entity-id';

export interface StorageShareLinkProps {
  id: UniqueEntityID;
  tenantId: UniqueEntityID;
  fileId: UniqueEntityID;
  token: string;
  expiresAt: Date | null;
  password: string | null;
  maxDownloads: number | null;
  downloadCount: number;
  isActive: boolean;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
}

export class StorageShareLink extends Entity<StorageShareLinkProps> {
  // Getters
  get shareLinkId(): UniqueEntityID {
    return this.props.id;
  }

  get tenantId(): UniqueEntityID {
    return this.props.tenantId;
  }

  get fileId(): UniqueEntityID {
    return this.props.fileId;
  }

  get token(): string {
    return this.props.token;
  }

  get expiresAt(): Date | null {
    return this.props.expiresAt;
  }

  get password(): string | null {
    return this.props.password;
  }

  get maxDownloads(): number | null {
    return this.props.maxDownloads;
  }

  get downloadCount(): number {
    return this.props.downloadCount;
  }

  get isActive(): boolean {
    return this.props.isActive;
  }

  get createdBy(): string {
    return this.props.createdBy;
  }

  get createdAt(): Date {
    return this.props.createdAt;
  }

  get updatedAt(): Date {
    return this.props.updatedAt;
  }

  // Computed Properties
  get isExpired(): boolean {
    if (!this.props.expiresAt) return false;
    return this.props.expiresAt < new Date();
  }

  get isDownloadLimitReached(): boolean {
    if (this.props.maxDownloads === null) return false;
    return this.props.downloadCount >= this.props.maxDownloads;
  }

  get canAccess(): boolean {
    return (
      this.props.isActive && !this.isExpired && !this.isDownloadLimitReached
    );
  }

  // Business Methods
  incrementDownloads(): void {
    this.props.downloadCount += 1;
    this.touch();
  }

  revoke(): void {
    this.props.isActive = false;
    this.touch();
  }

  private touch(): void {
    this.props.updatedAt = new Date();
  }

  static create(
    props: Optional<
      StorageShareLinkProps,
      | 'id'
      | 'createdAt'
      | 'updatedAt'
      | 'expiresAt'
      | 'password'
      | 'maxDownloads'
      | 'downloadCount'
      | 'isActive'
    >,
    id?: UniqueEntityID,
  ): StorageShareLink {
    const storageShareLink = new StorageShareLink(
      {
        ...props,
        id: id ?? new UniqueEntityID(),
        expiresAt: props.expiresAt ?? null,
        password: props.password ?? null,
        maxDownloads: props.maxDownloads ?? null,
        downloadCount: props.downloadCount ?? 0,
        isActive: props.isActive ?? true,
        createdAt: props.createdAt ?? new Date(),
        updatedAt: props.updatedAt ?? new Date(),
      },
      id,
    );

    return storageShareLink;
  }
}
