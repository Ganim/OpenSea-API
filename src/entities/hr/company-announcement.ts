import { Entity } from '../domain/entities';
import { UniqueEntityID } from '../domain/unique-entity-id';

export type AnnouncementPriority = 'NORMAL' | 'IMPORTANT' | 'URGENT';

export interface CompanyAnnouncementProps {
  tenantId: UniqueEntityID;
  title: string;
  content: string;
  priority: AnnouncementPriority;
  publishedAt?: Date;
  expiresAt?: Date;
  authorEmployeeId?: UniqueEntityID;
  targetDepartmentIds?: string[];
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export class CompanyAnnouncement extends Entity<CompanyAnnouncementProps> {
  get tenantId(): UniqueEntityID {
    return this.props.tenantId;
  }

  get title(): string {
    return this.props.title;
  }

  get content(): string {
    return this.props.content;
  }

  get priority(): AnnouncementPriority {
    return this.props.priority;
  }

  get publishedAt(): Date | undefined {
    return this.props.publishedAt;
  }

  get expiresAt(): Date | undefined {
    return this.props.expiresAt;
  }

  get authorEmployeeId(): UniqueEntityID | undefined {
    return this.props.authorEmployeeId;
  }

  get targetDepartmentIds(): string[] | undefined {
    return this.props.targetDepartmentIds;
  }

  get isActive(): boolean {
    return this.props.isActive;
  }

  get createdAt(): Date {
    return this.props.createdAt;
  }

  get updatedAt(): Date {
    return this.props.updatedAt;
  }

  isPublished(): boolean {
    return !!this.publishedAt;
  }

  isExpired(): boolean {
    if (!this.expiresAt) return false;
    return new Date() > this.expiresAt;
  }

  isTargetedToAll(): boolean {
    return !this.targetDepartmentIds || this.targetDepartmentIds.length === 0;
  }

  isVisibleToDepartment(departmentId: string): boolean {
    if (this.isTargetedToAll()) return true;
    return this.targetDepartmentIds!.includes(departmentId);
  }

  publish(): void {
    this.props.publishedAt = new Date();
    this.props.isActive = true;
    this.props.updatedAt = new Date();
  }

  deactivate(): void {
    this.props.isActive = false;
    this.props.updatedAt = new Date();
  }

  updateDetails(params: {
    title?: string;
    content?: string;
    priority?: AnnouncementPriority;
    expiresAt?: Date;
    targetDepartmentIds?: string[];
  }): void {
    if (params.title !== undefined) this.props.title = params.title;
    if (params.content !== undefined) this.props.content = params.content;
    if (params.priority !== undefined) this.props.priority = params.priority;
    if (params.expiresAt !== undefined) this.props.expiresAt = params.expiresAt;
    if (params.targetDepartmentIds !== undefined)
      this.props.targetDepartmentIds = params.targetDepartmentIds;
    this.props.updatedAt = new Date();
  }

  private constructor(props: CompanyAnnouncementProps, id?: UniqueEntityID) {
    super(props, id);
  }

  static create(
    props: Omit<CompanyAnnouncementProps, 'createdAt' | 'updatedAt'>,
    id?: UniqueEntityID,
  ): CompanyAnnouncement {
    const now = new Date();
    return new CompanyAnnouncement(
      {
        ...props,
        createdAt: now,
        updatedAt: now,
      },
      id,
    );
  }
}
