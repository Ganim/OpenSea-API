import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import type { Deduction as PrismaDeduction } from '@prisma/client';

export function mapDeductionPrismaToDomain(deduction: PrismaDeduction) {
  return {
    employeeId: new UniqueEntityID(deduction.employeeId),
    name: deduction.name,
    amount: Number(deduction.amount),
    reason: deduction.reason,
    date: deduction.date,
    isRecurring: deduction.isRecurring,
    installments: deduction.installments ?? undefined,
    currentInstallment: deduction.currentInstallment ?? undefined,
    isApplied: deduction.isApplied,
    appliedAt: deduction.appliedAt ?? undefined,
    createdAt: deduction.createdAt,
    updatedAt: deduction.updatedAt,
  };
}
