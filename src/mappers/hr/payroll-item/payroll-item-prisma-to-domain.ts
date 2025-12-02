import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import { PayrollItemType } from '@/entities/hr/value-objects';
import type { PayrollItem as PrismaPayrollItem } from '@prisma/client';

export function mapPayrollItemPrismaToDomain(item: PrismaPayrollItem) {
  return {
    payrollId: new UniqueEntityID(item.payrollId),
    employeeId: new UniqueEntityID(item.employeeId),
    type: PayrollItemType.create(item.type),
    description: item.description,
    amount: Number(item.amount),
    isDeduction: item.isDeduction,
    referenceId: item.referenceId ?? undefined,
    referenceType: item.referenceType ?? undefined,
    createdAt: item.createdAt,
    updatedAt: item.updatedAt,
  };
}
