import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import type { SalaryChangeReason } from '@/entities/hr/salary-history';
import type { SalaryHistory as PrismaSalaryHistory } from '@prisma/generated/client.js';

export function mapSalaryHistoryPrismaToDomain(record: PrismaSalaryHistory) {
  return {
    tenantId: new UniqueEntityID(record.tenantId),
    employeeId: new UniqueEntityID(record.employeeId),
    previousSalary:
      record.previousSalary === null
        ? undefined
        : Number(record.previousSalary),
    newSalary: Number(record.newSalary),
    reason: record.reason as SalaryChangeReason,
    notes: record.notes ?? undefined,
    effectiveDate: record.effectiveDate,
    changedBy: new UniqueEntityID(record.changedBy),
    createdAt: record.createdAt,
  };
}
