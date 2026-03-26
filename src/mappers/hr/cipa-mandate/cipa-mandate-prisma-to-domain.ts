import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import type { CipaMandate as PrismaCipaMandate } from '@prisma/generated/client.js';

export function mapCipaMandatePrismaToDomain(record: PrismaCipaMandate) {
  return {
    tenantId: new UniqueEntityID(record.tenantId),
    name: record.name,
    startDate: record.startDate,
    endDate: record.endDate,
    status: record.status as 'ACTIVE' | 'EXPIRED' | 'DRAFT',
    electionDate: record.electionDate ?? undefined,
    notes: record.notes ?? undefined,
    createdAt: record.createdAt,
    updatedAt: record.updatedAt,
  };
}
