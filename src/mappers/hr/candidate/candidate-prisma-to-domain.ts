import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import type { Candidate as PrismaCandidate } from '@prisma/generated/client.js';

export function mapCandidatePrismaToDomain(candidate: PrismaCandidate) {
  return {
    tenantId: new UniqueEntityID(candidate.tenantId),
    fullName: candidate.fullName,
    email: candidate.email,
    phone: candidate.phone ?? undefined,
    cpf: candidate.cpf ?? undefined,
    resumeUrl: candidate.resumeUrl ?? undefined,
    linkedinUrl: candidate.linkedinUrl ?? undefined,
    source: candidate.source,
    notes: candidate.notes ?? undefined,
    tags: (candidate.tags as string[]) ?? undefined,
    createdAt: candidate.createdAt,
    updatedAt: candidate.updatedAt,
    deletedAt: candidate.deletedAt ?? undefined,
  };
}
