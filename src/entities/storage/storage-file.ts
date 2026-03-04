import { Entity } from '../domain/entities';
import { Optional } from '../domain/optional';
import { UniqueEntityID } from '../domain/unique-entity-id';
import type { StorageFileVersion } from './storage-file-version';
import { StorageFileStatus } from './value-objects/storage-file-status';

export interface StorageFileProps {
  id: UniqueEntityID;
  tenantId: UniqueEntityID;
  folderId: UniqueEntityID | null;
  name: string;
  originalName: string;
  fileKey: string;
  path: string;
  size: number;
  mimeType: string;
  fileType: string;
  thumbnailKey: string | null;
  status: StorageFileStatus;
  currentVersion: number;
  entityType: string | null;
  entityId: string | null;
  expiresAt: Date | null;
  uploadedBy: string;
  isEncrypted: boolean;
  isProtected: boolean;
  protectionHash: string | null;
  isHidden: boolean;
  versions?: StorageFileVersion[];
  createdAt: Date;
  updatedAt: Date;
  deletedAt: Date | null;
}

export class StorageFile extends Entity<StorageFileProps> {
  // Getters
  get fileId(): UniqueEntityID {
    return this.props.id;
  }

  get tenantId(): UniqueEntityID {
    return this.props.tenantId;
  }

  get folderId(): UniqueEntityID | null {
    return this.props.folderId;
  }

  get name(): string {
    return this.props.name;
  }

  get originalName(): string {
    return this.props.originalName;
  }

  get fileKey(): string {
    return this.props.fileKey;
  }

  get path(): string {
    return this.props.path;
  }

  get size(): number {
    return this.props.size;
  }

  get mimeType(): string {
    return this.props.mimeType;
  }

  get fileType(): string {
    return this.props.fileType;
  }

  get thumbnailKey(): string | null {
    return this.props.thumbnailKey;
  }

  get status(): StorageFileStatus {
    return this.props.status;
  }

  get currentVersion(): number {
    return this.props.currentVersion;
  }

  get entityType(): string | null {
    return this.props.entityType;
  }

  get entityId(): string | null {
    return this.props.entityId;
  }

  get expiresAt(): Date | null {
    return this.props.expiresAt;
  }

  get uploadedBy(): string {
    return this.props.uploadedBy;
  }

  get isEncrypted(): boolean {
    return this.props.isEncrypted;
  }

  get isProtected(): boolean {
    return this.props.isProtected;
  }

  get protectionHash(): string | null {
    return this.props.protectionHash;
  }

  get isHidden(): boolean {
    return this.props.isHidden;
  }

  get versions(): StorageFileVersion[] | undefined {
    return this.props.versions;
  }

  get createdAt(): Date {
    return this.props.createdAt;
  }

  get updatedAt(): Date {
    return this.props.updatedAt;
  }

  get deletedAt(): Date | null {
    return this.props.deletedAt;
  }

  // Setters
  set folderId(folderId: UniqueEntityID | null) {
    this.props.folderId = folderId;
    this.touch();
  }

  set name(name: string) {
    this.props.name = name;
    this.touch();
  }

  set path(path: string) {
    this.props.path = path;
    this.touch();
  }

  set thumbnailKey(thumbnailKey: string | null) {
    this.props.thumbnailKey = thumbnailKey;
    this.touch();
  }

  set status(status: StorageFileStatus) {
    this.props.status = status;
    this.touch();
  }

  set currentVersion(currentVersion: number) {
    this.props.currentVersion = currentVersion;
    this.touch();
  }

  set deletedAt(deletedAt: Date | null) {
    this.props.deletedAt = deletedAt;
    this.touch();
  }

  // Computed Properties
  get isDeleted(): boolean {
    return this.props.deletedAt !== null;
  }

  get isActive(): boolean {
    return this.props.status.isActive;
  }

  get isArchived(): boolean {
    return this.props.status.isArchived;
  }

  get isExpired(): boolean {
    if (!this.props.expiresAt) return false;
    return this.props.expiresAt < new Date();
  }

  get hasEntityBinding(): boolean {
    return this.props.entityType !== null && this.props.entityId !== null;
  }

  get hasThumbnail(): boolean {
    return this.props.thumbnailKey !== null;
  }

  get isAccessible(): boolean {
    return this.props.status.isAccessible && !this.isDeleted && !this.isExpired;
  }

  // Business Methods
  archive(): void {
    this.status = StorageFileStatus.create('ARCHIVED');
  }

  activate(): void {
    this.status = StorageFileStatus.create('ACTIVE');
  }

  delete(): void {
    this.props.deletedAt = new Date();
    this.status = StorageFileStatus.create('DELETED');
  }

  restore(): void {
    this.props.deletedAt = null;
    this.status = StorageFileStatus.create('ACTIVE');
  }

  incrementVersion(): void {
    this.currentVersion = this.currentVersion + 1;
  }

  private touch(): void {
    this.props.updatedAt = new Date();
  }

  static create(
    props: Optional<
      StorageFileProps,
      | 'id'
      | 'createdAt'
      | 'updatedAt'
      | 'deletedAt'
      | 'status'
      | 'currentVersion'
      | 'thumbnailKey'
      | 'entityType'
      | 'entityId'
      | 'expiresAt'
      | 'isEncrypted'
      | 'isProtected'
      | 'protectionHash'
      | 'isHidden'
    >,
    id?: UniqueEntityID,
  ): StorageFile {
    const storageFile = new StorageFile(
      {
        ...props,
        id: id ?? new UniqueEntityID(),
        thumbnailKey: props.thumbnailKey ?? null,
        status: props.status ?? StorageFileStatus.create('ACTIVE'),
        currentVersion: props.currentVersion ?? 1,
        entityType: props.entityType ?? null,
        entityId: props.entityId ?? null,
        expiresAt: props.expiresAt ?? null,
        isEncrypted: props.isEncrypted ?? false,
        isProtected: props.isProtected ?? false,
        protectionHash: props.protectionHash ?? null,
        isHidden: props.isHidden ?? false,
        createdAt: props.createdAt ?? new Date(),
        updatedAt: props.updatedAt ?? new Date(),
        deletedAt: props.deletedAt ?? null,
      },
      id,
    );

    return storageFile;
  }
}
