import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import { JobPosting } from '@/entities/hr/job-posting';
import type {
  CreateJobPostingSchema,
  FindJobPostingFilters,
  JobPostingsRepository,
  UpdateJobPostingSchema,
} from '../job-postings-repository';

export class InMemoryJobPostingsRepository implements JobPostingsRepository {
  public items: JobPosting[] = [];

  async create(data: CreateJobPostingSchema): Promise<JobPosting> {
    const jobPosting = JobPosting.create({
      tenantId: new UniqueEntityID(data.tenantId),
      title: data.title,
      description: data.description,
      departmentId: data.departmentId
        ? new UniqueEntityID(data.departmentId)
        : undefined,
      positionId: data.positionId
        ? new UniqueEntityID(data.positionId)
        : undefined,
      status: data.status ?? 'DRAFT',
      type: data.type ?? 'FULL_TIME',
      location: data.location,
      salaryMin: data.salaryMin,
      salaryMax: data.salaryMax,
      requirements: data.requirements,
      benefits: data.benefits,
      maxApplicants: data.maxApplicants,
    });

    this.items.push(jobPosting);
    return jobPosting;
  }

  async findById(
    id: UniqueEntityID,
    tenantId: string,
  ): Promise<JobPosting | null> {
    return (
      this.items.find(
        (posting) =>
          posting.id.equals(id) &&
          posting.tenantId.toString() === tenantId &&
          !posting.deletedAt,
      ) ?? null
    );
  }

  async findMany(
    tenantId: string,
    filters?: FindJobPostingFilters,
  ): Promise<{ jobPostings: JobPosting[]; total: number }> {
    let filtered = this.items.filter(
      (posting) =>
        posting.tenantId.toString() === tenantId && !posting.deletedAt,
    );

    if (filters?.status) {
      filtered = filtered.filter(
        (posting) => posting.status === filters.status,
      );
    }
    if (filters?.type) {
      filtered = filtered.filter(
        (posting) => posting.type === filters.type,
      );
    }
    if (filters?.departmentId) {
      filtered = filtered.filter(
        (posting) =>
          posting.departmentId?.toString() === filters.departmentId,
      );
    }
    if (filters?.positionId) {
      filtered = filtered.filter(
        (posting) =>
          posting.positionId?.toString() === filters.positionId,
      );
    }
    if (filters?.search) {
      const searchLower = filters.search.toLowerCase();
      filtered = filtered.filter((posting) =>
        posting.title.toLowerCase().includes(searchLower),
      );
    }

    const total = filtered.length;
    const sorted = filtered.sort(
      (a, b) => b.createdAt.getTime() - a.createdAt.getTime(),
    );
    const page = filters?.page ?? 1;
    const perPage = Math.min(filters?.perPage ?? 20, 100);

    return {
      jobPostings: sorted.slice((page - 1) * perPage, page * perPage),
      total,
    };
  }

  async update(data: UpdateJobPostingSchema): Promise<JobPosting | null> {
    const index = this.items.findIndex((posting) =>
      posting.id.equals(data.id),
    );
    if (index === -1) return null;

    const posting = this.items[index];

    if (data.title !== undefined) posting.updateTitle(data.title);
    if (data.description !== undefined) {
      posting.props.description = data.description;
      posting.props.updatedAt = new Date();
    }
    if (data.departmentId !== undefined) {
      posting.props.departmentId = new UniqueEntityID(data.departmentId);
      posting.props.updatedAt = new Date();
    }
    if (data.positionId !== undefined) {
      posting.props.positionId = new UniqueEntityID(data.positionId);
      posting.props.updatedAt = new Date();
    }
    if (data.status !== undefined) {
      posting.props.status = data.status;
      posting.props.updatedAt = new Date();
    }
    if (data.type !== undefined) {
      posting.props.type = data.type;
      posting.props.updatedAt = new Date();
    }
    if (data.location !== undefined) {
      posting.props.location = data.location;
      posting.props.updatedAt = new Date();
    }
    if (data.salaryMin !== undefined) {
      posting.props.salaryMin = data.salaryMin;
      posting.props.updatedAt = new Date();
    }
    if (data.salaryMax !== undefined) {
      posting.props.salaryMax = data.salaryMax;
      posting.props.updatedAt = new Date();
    }
    if (data.requirements !== undefined) {
      posting.props.requirements = data.requirements;
      posting.props.updatedAt = new Date();
    }
    if (data.benefits !== undefined) {
      posting.props.benefits = data.benefits;
      posting.props.updatedAt = new Date();
    }
    if (data.maxApplicants !== undefined) {
      posting.props.maxApplicants = data.maxApplicants;
      posting.props.updatedAt = new Date();
    }
    if (data.publishedAt !== undefined) {
      posting.props.publishedAt = data.publishedAt;
      posting.props.updatedAt = new Date();
    }
    if (data.closedAt !== undefined) {
      posting.props.closedAt = data.closedAt;
      posting.props.updatedAt = new Date();
    }

    return posting;
  }

  async delete(id: UniqueEntityID): Promise<void> {
    const index = this.items.findIndex((posting) => posting.id.equals(id));
    if (index >= 0) {
      this.items[index].softDelete();
    }
  }
}
