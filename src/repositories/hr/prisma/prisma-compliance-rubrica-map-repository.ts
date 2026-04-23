import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import type { ComplianceRubricaConcept } from '@/entities/hr/compliance-rubrica-map';
import {
  COMPLIANCE_RUBRICA_CONCEPTS,
  ComplianceRubricaMap,
} from '@/entities/hr/compliance-rubrica-map';
import { prisma } from '@/lib/prisma';

import type {
  ComplianceRubricaMapRepository,
  UpsertComplianceRubricaMapParams,
  UpsertComplianceRubricaMapResult,
} from '../compliance-rubrica-map-repository';

function mapToDomain(row: {
  id: string;
  tenantId: string;
  clrConcept: string;
  codRubr: string;
  ideTabRubr: string;
  indApurIR: number | null;
  createdAt: Date;
  updatedAt: Date;
  updatedBy: string;
}): ComplianceRubricaMap {
  if (!COMPLIANCE_RUBRICA_CONCEPTS.includes(row.clrConcept as never)) {
    // Defensive guard: DB drift or manual insert with unknown concept.
    // Treat as data corruption — fail loud so audit notices.
    throw new Error(
      `[ComplianceRubricaMap] Unknown clrConcept in DB: ${row.clrConcept}`,
    );
  }

  return ComplianceRubricaMap.create(
    {
      tenantId: new UniqueEntityID(row.tenantId),
      clrConcept: row.clrConcept as ComplianceRubricaConcept,
      codRubr: row.codRubr,
      ideTabRubr: row.ideTabRubr,
      indApurIR: row.indApurIR ?? undefined,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
      updatedBy: new UniqueEntityID(row.updatedBy),
    },
    new UniqueEntityID(row.id),
  );
}

export class PrismaComplianceRubricaMapRepository implements ComplianceRubricaMapRepository {
  async findAllByTenant(tenantId: string): Promise<ComplianceRubricaMap[]> {
    const rows = await prisma.complianceRubricaMap.findMany({
      where: { tenantId },
      orderBy: { clrConcept: 'asc' },
    });
    return rows.map(mapToDomain);
  }

  async findByTenantAndConcept(
    tenantId: string,
    clrConcept: ComplianceRubricaConcept,
  ): Promise<ComplianceRubricaMap | null> {
    const row = await prisma.complianceRubricaMap.findUnique({
      where: { tenantId_clrConcept: { tenantId, clrConcept } },
    });
    if (!row) return null;
    return mapToDomain(row);
  }

  async upsert(
    params: UpsertComplianceRubricaMapParams,
  ): Promise<UpsertComplianceRubricaMapResult> {
    const updatedByStr =
      typeof params.updatedBy === 'string'
        ? params.updatedBy
        : params.updatedBy.toString();

    const existing = await prisma.complianceRubricaMap.findUnique({
      where: {
        tenantId_clrConcept: {
          tenantId: params.tenantId,
          clrConcept: params.clrConcept,
        },
      },
    });

    const created = existing === null;

    const row = await prisma.complianceRubricaMap.upsert({
      where: {
        tenantId_clrConcept: {
          tenantId: params.tenantId,
          clrConcept: params.clrConcept,
        },
      },
      create: {
        tenantId: params.tenantId,
        clrConcept: params.clrConcept,
        codRubr: params.codRubr,
        ideTabRubr: params.ideTabRubr,
        indApurIR: params.indApurIR ?? null,
        updatedBy: updatedByStr,
      },
      update: {
        codRubr: params.codRubr,
        ideTabRubr: params.ideTabRubr,
        indApurIR: params.indApurIR ?? null,
        updatedBy: updatedByStr,
      },
    });

    return { rubricaMap: mapToDomain(row), created };
  }
}
