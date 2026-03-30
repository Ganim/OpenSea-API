import { Entity } from '../domain/entities';
import { UniqueEntityID } from '../domain/unique-entity-id';

export interface JobPostingProps {
  tenantId: UniqueEntityID;
  title: string;
  description?: string;
  departmentId?: UniqueEntityID;
  positionId?: UniqueEntityID;
  status: string;
  type: string;
  location?: string;
  salaryMin?: number;
  salaryMax?: number;
  requirements?: unknown;
  benefits?: string;
  maxApplicants?: number;
  publishedAt?: Date;
  closedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
  deletedAt?: Date;
}

export class JobPosting extends Entity<JobPostingProps> {
  get tenantId(): UniqueEntityID {
    return this.props.tenantId;
  }

  get title(): string {
    return this.props.title;
  }

  get description(): string | undefined {
    return this.props.description;
  }

  get departmentId(): UniqueEntityID | undefined {
    return this.props.departmentId;
  }

  get positionId(): UniqueEntityID | undefined {
    return this.props.positionId;
  }

  get status(): string {
    return this.props.status;
  }

  get type(): string {
    return this.props.type;
  }

  get location(): string | undefined {
    return this.props.location;
  }

  get salaryMin(): number | undefined {
    return this.props.salaryMin;
  }

  get salaryMax(): number | undefined {
    return this.props.salaryMax;
  }

  get requirements(): unknown | undefined {
    return this.props.requirements;
  }

  get benefits(): string | undefined {
    return this.props.benefits;
  }

  get maxApplicants(): number | undefined {
    return this.props.maxApplicants;
  }

  get publishedAt(): Date | undefined {
    return this.props.publishedAt;
  }

  get closedAt(): Date | undefined {
    return this.props.closedAt;
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

  publish(): void {
    this.props.status = 'OPEN';
    this.props.publishedAt = new Date();
    this.props.updatedAt = new Date();
  }

  close(): void {
    this.props.status = 'CLOSED';
    this.props.closedAt = new Date();
    this.props.updatedAt = new Date();
  }

  markFilled(): void {
    this.props.status = 'FILLED';
    this.props.closedAt = new Date();
    this.props.updatedAt = new Date();
  }

  softDelete(): void {
    this.props.deletedAt = new Date();
    this.props.updatedAt = new Date();
  }

  updateTitle(title: string): void {
    if (!title || title.trim().length === 0) {
      throw new Error('Job posting title cannot be empty');
    }
    this.props.title = title;
    this.props.updatedAt = new Date();
  }

  private constructor(props: JobPostingProps, id?: UniqueEntityID) {
    super(props, id);
  }

  static create(
    props: Omit<JobPostingProps, 'createdAt' | 'updatedAt'> & {
      createdAt?: Date;
      updatedAt?: Date;
    },
    id?: UniqueEntityID,
  ): JobPosting {
    const now = new Date();

    return new JobPosting(
      {
        ...props,
        status: props.status ?? 'DRAFT',
        type: props.type ?? 'FULL_TIME',
        createdAt: props.createdAt ?? now,
        updatedAt: props.updatedAt ?? now,
      },
      id,
    );
  }
}
