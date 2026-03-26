import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import type { CipaMember as PrismaCipaMember } from '@prisma/generated/client.js';

export function mapCipaMemberPrismaToDomain(record: PrismaCipaMember) {
  return {
    tenantId: new UniqueEntityID(record.tenantId),
    mandateId: new UniqueEntityID(record.mandateId),
    employeeId: new UniqueEntityID(record.employeeId),
    role: record.role as
      | 'PRESIDENTE'
      | 'VICE_PRESIDENTE'
      | 'SECRETARIO'
      | 'MEMBRO_TITULAR'
      | 'MEMBRO_SUPLENTE',
    type: record.type as 'EMPREGADOR' | 'EMPREGADO',
    isStable: record.isStable,
    stableUntil: record.stableUntil ?? undefined,
    createdAt: record.createdAt,
    updatedAt: record.updatedAt,
  };
}
