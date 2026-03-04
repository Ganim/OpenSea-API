import { Entity } from '../domain/entities';
import { Optional } from '../domain/optional';
import { UniqueEntityID } from '../domain/unique-entity-id';

export interface FolderAccessRuleProps {
  id: UniqueEntityID;
  tenantId: UniqueEntityID;
  folderId: UniqueEntityID;
  userId: UniqueEntityID | null;
  groupId: UniqueEntityID | null;
  teamId: UniqueEntityID | null;
  canRead: boolean;
  canWrite: boolean;
  canDelete: boolean;
  canShare: boolean;
  isInherited: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export class FolderAccessRule extends Entity<FolderAccessRuleProps> {
  // Getters
  get ruleId(): UniqueEntityID {
    return this.props.id;
  }

  get tenantId(): UniqueEntityID {
    return this.props.tenantId;
  }

  get folderId(): UniqueEntityID {
    return this.props.folderId;
  }

  get userId(): UniqueEntityID | null {
    return this.props.userId;
  }

  get groupId(): UniqueEntityID | null {
    return this.props.groupId;
  }

  get teamId(): UniqueEntityID | null {
    return this.props.teamId;
  }

  get canRead(): boolean {
    return this.props.canRead;
  }

  get canWrite(): boolean {
    return this.props.canWrite;
  }

  get canDelete(): boolean {
    return this.props.canDelete;
  }

  get canShare(): boolean {
    return this.props.canShare;
  }

  get isInherited(): boolean {
    return this.props.isInherited;
  }

  get createdAt(): Date {
    return this.props.createdAt;
  }

  get updatedAt(): Date {
    return this.props.updatedAt;
  }

  // Setters
  set canRead(canRead: boolean) {
    this.props.canRead = canRead;
    this.touch();
  }

  set canWrite(canWrite: boolean) {
    this.props.canWrite = canWrite;
    this.touch();
  }

  set canDelete(canDelete: boolean) {
    this.props.canDelete = canDelete;
    this.touch();
  }

  set canShare(canShare: boolean) {
    this.props.canShare = canShare;
    this.touch();
  }

  // Computed Properties
  get isUserRule(): boolean {
    return this.props.userId !== null;
  }

  get isGroupRule(): boolean {
    return this.props.groupId !== null;
  }

  get isTeamRule(): boolean {
    return this.props.teamId !== null;
  }

  get hasFullAccess(): boolean {
    return (
      this.props.canRead &&
      this.props.canWrite &&
      this.props.canDelete &&
      this.props.canShare
    );
  }

  get isReadOnly(): boolean {
    return (
      this.props.canRead &&
      !this.props.canWrite &&
      !this.props.canDelete &&
      !this.props.canShare
    );
  }

  get hasNoAccess(): boolean {
    return (
      !this.props.canRead &&
      !this.props.canWrite &&
      !this.props.canDelete &&
      !this.props.canShare
    );
  }

  get hasWriteAccess(): boolean {
    return this.props.canRead && this.props.canWrite;
  }

  // Business Methods
  grantFullAccess(): void {
    this.canRead = true;
    this.canWrite = true;
    this.canDelete = true;
    this.canShare = true;
  }

  grantReadOnly(): void {
    this.canRead = true;
    this.canWrite = false;
    this.canDelete = false;
    this.canShare = false;
  }

  grantWriteAccess(): void {
    this.canRead = true;
    this.canWrite = true;
    this.canDelete = false;
    this.canShare = false;
  }

  revokeAll(): void {
    this.canRead = false;
    this.canWrite = false;
    this.canDelete = false;
    this.canShare = false;
  }

  private touch(): void {
    this.props.updatedAt = new Date();
  }

  static create(
    props: Optional<
      FolderAccessRuleProps,
      | 'id'
      | 'createdAt'
      | 'updatedAt'
      | 'canRead'
      | 'canWrite'
      | 'canDelete'
      | 'canShare'
      | 'isInherited'
    >,
    id?: UniqueEntityID,
  ): FolderAccessRule {
    const folderAccessRule = new FolderAccessRule(
      {
        ...props,
        id: id ?? new UniqueEntityID(),
        canRead: props.canRead ?? true,
        canWrite: props.canWrite ?? false,
        canDelete: props.canDelete ?? false,
        canShare: props.canShare ?? false,
        isInherited: props.isInherited ?? false,
        createdAt: props.createdAt ?? new Date(),
        updatedAt: props.updatedAt ?? new Date(),
      },
      id,
    );

    return folderAccessRule;
  }
}
