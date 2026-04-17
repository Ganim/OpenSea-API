import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import { Application } from '@/entities/hr/application';
import { prisma } from '@/lib/prisma';
import { mapApplicationPrismaToDomain } from '@/mappers/hr/application';
import type {
  ApplicationsRepository,
  CreateApplicationSchema,
  FindApplicationFilters,
  UpdateApplicationSchema,
} from '../applications-repository';

export class PrismaApplicationsRepository implements ApplicationsRepository {
  async create(data: CreateApplicationSchema): Promise<Application> {
    const applicationData = await prisma.application.create({
      data: {
        tenantId: data.tenantId,
        jobPostingId: data.jobPostingId,
        candidateId: data.candidateId,
        status: (data.status as 'APPLIED') ?? 'APPLIED',
        currentStageId: data.currentStageId,
      },
    });

    return Application.create(
      mapApplicationPrismaToDomain(applicationData),
      new UniqueEntityID(applicationData.id),
    );
  }

  async findById(
    id: UniqueEntityID,
    tenantId: string,
  ): Promise<Application | null> {
    const applicationData = await prisma.application.findFirst({
      where: { id: id.toString(), tenantId },
    });

    if (!applicationData) return null;

    return Application.create(
      mapApplicationPrismaToDomain(applicationData),
      new UniqueEntityID(applicationData.id),
    );
  }

  async findByJobAndCandidate(
    jobPostingId: string,
    candidateId: string,
    tenantId: string,
  ): Promise<Application | null> {
    const applicationData = await prisma.application.findFirst({
      where: { jobPostingId, candidateId, tenantId },
    });

    if (!applicationData) return null;

    return Application.create(
      mapApplicationPrismaToDomain(applicationData),
      new UniqueEntityID(applicationData.id),
    );
  }

  async findMany(
    tenantId: string,
    filters?: FindApplicationFilters,
  ): Promise<{ applications: Application[]; total: number }> {
    const page = filters?.page ?? 1;
    const perPage = Math.min(filters?.perPage ?? 20, 100);
    const skip = (page - 1) * perPage;

    const where = {
      tenantId,
      jobPostingId: filters?.jobPostingId,
      candidateId: filters?.candidateId,
      status: filters?.status as 'APPLIED' | undefined,
    };

    const [applicationsData, total] = await Promise.all([
      prisma.application.findMany({
        where,
        orderBy: { appliedAt: 'desc' },
        skip,
        take: perPage,
      }),
      prisma.application.count({ where }),
    ]);

    const applications = applicationsData.map((application) =>
      Application.create(
        mapApplicationPrismaToDomain(application),
        new UniqueEntityID(application.id),
      ),
    );

    return { applications, total };
  }

  async update(data: UpdateApplicationSchema): Promise<Application | null> {
    const existingApplication = await prisma.application.findUnique({
      where: {
        id: data.id.toString(),
        ...(data.tenantId && { tenantId: data.tenantId }),
      },
    });

    if (!existingApplication) return null;

    const applicationData = await prisma.application.update({
      where: {
        id: data.id.toString(),
        ...(data.tenantId && { tenantId: data.tenantId }),
      },
      data: {
        status: data.status as 'APPLIED' | undefined,
        currentStageId: data.currentStageId,
        rejectedAt: data.rejectedAt,
        rejectionReason: data.rejectionReason,
        hiredAt: data.hiredAt,
        rating: data.rating,
      },
    });

    return Application.create(
      mapApplicationPrismaToDomain(applicationData),
      new UniqueEntityID(applicationData.id),
    );
  }

  async countByJobPosting(
    jobPostingId: string,
    tenantId: string,
  ): Promise<number> {
    return prisma.application.count({
      where: { jobPostingId, tenantId },
    });
  }
}
