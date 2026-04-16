import { Entity } from '../domain/entities';
import { UniqueEntityID } from '../domain/unique-entity-id';

export type AnnouncementPriority = 'NORMAL' | 'IMPORTANT' | 'URGENT';

/**
 * Structured audience targeting persisted inside the
 * {@link CompanyAnnouncement.targetDepartmentIds} Json column.
 *
 * Backward compatible — legacy records that store a plain `string[]` are
 * interpreted as `{ departments: string[] }` by {@link parseAudienceTargets}.
 */
export interface AnnouncementAudienceTargets {
  departments?: string[];
  teams?: string[];
  roles?: string[];
  employees?: string[];
}

export interface CompanyAnnouncementProps {
  tenantId: UniqueEntityID;
  title: string;
  content: string;
  priority: AnnouncementPriority;
  publishedAt?: Date;
  expiresAt?: Date;
  authorEmployeeId?: UniqueEntityID;
  /**
   * Raw audience payload as stored on the database. Can either be a legacy
   * `string[]` (treated as `departments`) or an object containing any of the
   * supported audience dimensions: departments, teams, roles, employees.
   */
  targetDepartmentIds?: string[] | AnnouncementAudienceTargets;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Normalises the raw `targetDepartmentIds` payload into a structured
 * {@link AnnouncementAudienceTargets} object regardless of legacy/new format.
 */
export function parseAudienceTargets(
  raw: string[] | AnnouncementAudienceTargets | null | undefined,
): AnnouncementAudienceTargets {
  if (!raw) return {};

  if (Array.isArray(raw)) {
    return raw.length > 0 ? { departments: raw } : {};
  }

  return {
    departments: raw.departments ?? [],
    teams: raw.teams ?? [],
    roles: raw.roles ?? [],
    employees: raw.employees ?? [],
  };
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

  /**
   * Legacy accessor — returns the `departments` slice of the structured
   * audience targets. Prefer {@link audienceTargets} for new callers.
   */
  get targetDepartmentIds(): string[] | undefined {
    const targets = parseAudienceTargets(this.props.targetDepartmentIds);
    return targets.departments && targets.departments.length > 0
      ? targets.departments
      : undefined;
  }

  /**
   * Structured audience targets — always returns a fully populated object
   * (empty arrays when a dimension is not set).
   */
  get audienceTargets(): AnnouncementAudienceTargets {
    return parseAudienceTargets(this.props.targetDepartmentIds);
  }

  /**
   * Raw audience payload as it should be persisted. Already normalised when
   * the announcement was created/updated through this entity.
   */
  get audiencePayload(): string[] | AnnouncementAudienceTargets | undefined {
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

  /**
   * Returns `true` when no audience dimension is set — the announcement is
   * visible to every active employee in the tenant.
   */
  isTargetedToAll(): boolean {
    const targets = this.audienceTargets;
    return (
      (!targets.departments || targets.departments.length === 0) &&
      (!targets.teams || targets.teams.length === 0) &&
      (!targets.roles || targets.roles.length === 0) &&
      (!targets.employees || targets.employees.length === 0)
    );
  }

  isVisibleToDepartment(departmentId: string): boolean {
    if (this.isTargetedToAll()) return true;
    const targets = this.audienceTargets;
    return targets.departments?.includes(departmentId) ?? false;
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
    targetDepartmentIds?: string[] | AnnouncementAudienceTargets;
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
