import type { ComplianceArtifact } from '@/entities/hr/compliance-artifact';
import { prisma } from '@/lib/prisma';
import { complianceArtifactPrismaToDomain } from '@/mappers/hr/compliance-artifact/prisma-to-domain';
import type {
  ComplianceArtifactType as PrismaComplianceArtifactType,
  Prisma,
} from '@prisma/generated/client.js';
import type {
  ComplianceArtifactRepository,
  FindManyComplianceArtifactFilters,
} from '../compliance-artifact-repository';

/**
 * Implementação Prisma — multi-tenant: toda query filtra por `tenantId`.
 * Listagem ordena por `generatedAt DESC` (mais recente primeiro) e exclui
 * soft-deleted (`deletedAt: null`).
 */
export class PrismaComplianceArtifactRepository
  implements ComplianceArtifactRepository
{
  async create(artifact: ComplianceArtifact): Promise<void> {
    await prisma.complianceArtifact.create({
      data: {
        id: artifact.id.toString(),
        tenantId: artifact.tenantId.toString(),
        type: artifact.type as PrismaComplianceArtifactType,
        periodStart: artifact.periodStart ?? null,
        periodEnd: artifact.periodEnd ?? null,
        competencia: artifact.competencia ?? null,
        filters:
          (artifact.filters as Prisma.InputJsonValue | undefined) ?? undefined,
        storageKey: artifact.storageKey,
        contentHash: artifact.contentHash,
        sizeBytes: artifact.sizeBytes,
        generatedBy: artifact.generatedBy.toString(),
        generatedAt: artifact.generatedAt,
        deletedAt: artifact.deletedAt ?? null,
      },
    });
  }

  async findById(
    id: string,
    tenantId: string,
  ): Promise<ComplianceArtifact | null> {
    const raw = await prisma.complianceArtifact.findFirst({
      where: { id, tenantId, deletedAt: null },
    });
    return raw ? complianceArtifactPrismaToDomain(raw) : null;
  }

  async findByIdWithoutTenant(id: string): Promise<ComplianceArtifact | null> {
    const raw = await prisma.complianceArtifact.findUnique({
      where: { id },
    });
    return raw ? complianceArtifactPrismaToDomain(raw) : null;
  }

  async findManyByTenant(params: {
    tenantId: string;
    filters?: FindManyComplianceArtifactFilters;
  }): Promise<{ items: ComplianceArtifact[]; total: number }> {
    const { tenantId, filters = {} } = params;
    const page = filters.page ?? 1;
    const limit = filters.limit ?? 50;

    const where: Prisma.ComplianceArtifactWhereInput = {
      tenantId,
      deletedAt: null,
      ...(filters.type
        ? { type: filters.type as PrismaComplianceArtifactType }
        : {}),
      ...(filters.competencia ? { competencia: filters.competencia } : {}),
      ...(filters.periodStart
        ? { periodStart: { gte: filters.periodStart } }
        : {}),
      ...(filters.periodEnd ? { periodEnd: { lte: filters.periodEnd } } : {}),
    };

    const [rows, total] = await Promise.all([
      prisma.complianceArtifact.findMany({
        where,
        orderBy: { generatedAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.complianceArtifact.count({ where }),
    ]);

    return { items: rows.map(complianceArtifactPrismaToDomain), total };
  }

  async softDelete(id: string, tenantId: string): Promise<void> {
    await prisma.complianceArtifact.updateMany({
      where: { id, tenantId, deletedAt: null },
      data: { deletedAt: new Date() },
    });
  }
}
