import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import { JobPosting } from '@/entities/hr/job-posting';
import { prisma } from '@/lib/prisma';
import { mapJobPostingPrismaToDomain } from '@/mappers/hr/job-posting';
import type {
  CreateJobPostingSchema,
  FindJobPostingFilters,
  JobPostingsRepository,
  UpdateJobPostingSchema,
} from '../job-postings-repository';

export class PrismaJobPostingsRepository implements JobPostingsRepository {
  async create(data: CreateJobPostingSchema): Promise<JobPosting> {
    const postingData = await prisma.jobPosting.create({
      data: {
        tenantId: data.tenantId,
        title: data.title,
        description: data.description,
        departmentId: data.departmentId,
        positionId: data.positionId,
        status: (data.status as 'DRAFT') ?? 'DRAFT',
        type: (data.type as 'FULL_TIME') ?? 'FULL_TIME',
        location: data.location,
        salaryMin: data.salaryMin,
        salaryMax: data.salaryMax,
        requirements: data.requirements as object,
        benefits: data.benefits,
        maxApplicants: data.maxApplicants,
      },
    });

    return JobPosting.create(
      mapJobPostingPrismaToDomain(postingData),
      new UniqueEntityID(postingData.id),
    );
  }

  async findById(
    id: UniqueEntityID,
    tenantId: string,
  ): Promise<JobPosting | null> {
    const postingData = await prisma.jobPosting.findFirst({
      where: { id: id.toString(), tenantId, deletedAt: null },
    });

    if (!postingData) return null;

    return JobPosting.create(
      mapJobPostingPrismaToDomain(postingData),
      new UniqueEntityID(postingData.id),
    );
  }

  async findMany(
    tenantId: string,
    filters?: FindJobPostingFilters,
  ): Promise<{ jobPostings: JobPosting[]; total: number }> {
    const page = filters?.page ?? 1;
    const perPage = Math.min(filters?.perPage ?? 20, 100);
    const skip = (page - 1) * perPage;

    const where = {
      tenantId,
      deletedAt: null,
      status: filters?.status as 'DRAFT' | undefined,
      type: filters?.type as 'FULL_TIME' | undefined,
      departmentId: filters?.departmentId,
      positionId: filters?.positionId,
      ...(filters?.search
        ? {
            title: {
              contains: filters.search,
              mode: 'insensitive' as const,
            },
          }
        : {}),
    };

    const [postingsData, total] = await Promise.all([
      prisma.jobPosting.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: perPage,
      }),
      prisma.jobPosting.count({ where }),
    ]);

    const jobPostings = postingsData.map((posting) =>
      JobPosting.create(
        mapJobPostingPrismaToDomain(posting),
        new UniqueEntityID(posting.id),
      ),
    );

    return { jobPostings, total };
  }

  async update(data: UpdateJobPostingSchema): Promise<JobPosting | null> {
    const existingPosting = await prisma.jobPosting.findUnique({
      where: {
        id: data.id.toString(),
        ...(data.tenantId && { tenantId: data.tenantId }),
      },
    });

    if (!existingPosting) return null;

    const postingData = await prisma.jobPosting.update({
      where: {
        id: data.id.toString(),
        ...(data.tenantId && { tenantId: data.tenantId }),
      },
      data: {
        title: data.title,
        description: data.description,
        departmentId: data.departmentId,
        positionId: data.positionId,
        status: data.status as 'DRAFT' | undefined,
        type: data.type as 'FULL_TIME' | undefined,
        location: data.location,
        salaryMin: data.salaryMin,
        salaryMax: data.salaryMax,
        requirements: data.requirements as object | undefined,
        benefits: data.benefits,
        maxApplicants: data.maxApplicants,
        publishedAt: data.publishedAt,
        closedAt: data.closedAt,
      },
    });

    return JobPosting.create(
      mapJobPostingPrismaToDomain(postingData),
      new UniqueEntityID(postingData.id),
    );
  }

  async delete(id: UniqueEntityID, tenantId?: string): Promise<void> {
    await prisma.jobPosting.update({
      where: { id: id.toString(), ...(tenantId && { tenantId }) },
      data: { deletedAt: new Date() },
    });
  }
}
