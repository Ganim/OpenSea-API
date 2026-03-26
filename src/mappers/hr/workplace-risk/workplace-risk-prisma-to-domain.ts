import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import type { WorkplaceRisk as PrismaWorkplaceRisk } from '@prisma/generated/client.js';

export function mapWorkplaceRiskPrismaToDomain(record: PrismaWorkplaceRisk) {
  return {
    tenantId: new UniqueEntityID(record.tenantId),
    safetyProgramId: new UniqueEntityID(record.safetyProgramId),
    name: record.name,
    category: record.category as
      | 'FISICO'
      | 'QUIMICO'
      | 'BIOLOGICO'
      | 'ERGONOMICO'
      | 'ACIDENTE',
    severity: record.severity as 'BAIXO' | 'MEDIO' | 'ALTO' | 'CRITICO',
    source: record.source ?? undefined,
    affectedArea: record.affectedArea ?? undefined,
    controlMeasures: record.controlMeasures ?? undefined,
    epiRequired: record.epiRequired ?? undefined,
    isActive: record.isActive,
    createdAt: record.createdAt,
    updatedAt: record.updatedAt,
  };
}
