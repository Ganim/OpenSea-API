import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import type { JobPosting as PrismaJobPosting } from '@prisma/generated/client.js';

export function mapJobPostingPrismaToDomain(posting: PrismaJobPosting) {
  return {
    tenantId: new UniqueEntityID(posting.tenantId),
    title: posting.title,
    description: posting.description ?? undefined,
    departmentId: posting.departmentId
      ? new UniqueEntityID(posting.departmentId)
      : undefined,
    positionId: posting.positionId
      ? new UniqueEntityID(posting.positionId)
      : undefined,
    status: posting.status,
    type: posting.type,
    location: posting.location ?? undefined,
    salaryMin: posting.salaryMin ? Number(posting.salaryMin) : undefined,
    salaryMax: posting.salaryMax ? Number(posting.salaryMax) : undefined,
    requirements: posting.requirements ?? undefined,
    benefits: posting.benefits ?? undefined,
    maxApplicants: posting.maxApplicants ?? undefined,
    publishedAt: posting.publishedAt ?? undefined,
    closedAt: posting.closedAt ?? undefined,
    createdAt: posting.createdAt,
    updatedAt: posting.updatedAt,
    deletedAt: posting.deletedAt ?? undefined,
  };
}
