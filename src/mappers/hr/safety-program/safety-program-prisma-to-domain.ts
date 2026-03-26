import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import type { SafetyProgram as PrismaSafetyProgram } from '@prisma/generated/client.js';

export function mapSafetyProgramPrismaToDomain(record: PrismaSafetyProgram) {
  return {
    tenantId: new UniqueEntityID(record.tenantId),
    type: record.type as 'PCMSO' | 'PGR' | 'LTCAT' | 'PPRA',
    name: record.name,
    validFrom: record.validFrom,
    validUntil: record.validUntil,
    responsibleName: record.responsibleName,
    responsibleRegistration: record.responsibleRegistration,
    documentUrl: record.documentUrl ?? undefined,
    status: record.status as 'ACTIVE' | 'EXPIRED' | 'DRAFT',
    notes: record.notes ?? undefined,
    createdAt: record.createdAt,
    updatedAt: record.updatedAt,
  };
}
