export type StorageFileStatusValue = 'ACTIVE' | 'ARCHIVED' | 'DELETED';

export class StorageFileStatus {
  private readonly status: StorageFileStatusValue;

  private constructor(status: StorageFileStatusValue) {
    this.status = status;
  }

  static create(status: StorageFileStatusValue): StorageFileStatus {
    return new StorageFileStatus(status);
  }

  get value(): StorageFileStatusValue {
    return this.status;
  }

  // Status Checkers
  get isActive(): boolean {
    return this.status === 'ACTIVE';
  }

  get isArchived(): boolean {
    return this.status === 'ARCHIVED';
  }

  get isDeleted(): boolean {
    return this.status === 'DELETED';
  }

  // Business Logic
  get canBeModified(): boolean {
    return this.status === 'ACTIVE';
  }

  get canBeRestored(): boolean {
    return this.status === 'ARCHIVED' || this.status === 'DELETED';
  }

  get canBeArchived(): boolean {
    return this.status === 'ACTIVE';
  }

  get canBeDeleted(): boolean {
    return this.status === 'ACTIVE' || this.status === 'ARCHIVED';
  }

  get isAccessible(): boolean {
    return this.status === 'ACTIVE' || this.status === 'ARCHIVED';
  }

  equals(other: StorageFileStatus): boolean {
    return this.status === other.status;
  }
}
