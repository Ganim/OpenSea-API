import { prisma } from '@/lib/prisma';

export async function createDeduction(
  employeeId: string,
  data?: {
    name?: string;
    amount?: number;
    reason?: string;
    date?: Date;
    isRecurring?: boolean;
    installments?: number;
  },
) {
  return prisma.deduction.create({
    data: {
      employeeId,
      name: data?.name ?? 'Test Deduction',
      amount: data?.amount ?? 500,
      reason: data?.reason ?? 'Salary advance',
      date: data?.date ?? new Date(),
      isRecurring: data?.isRecurring ?? false,
      installments: data?.installments,
      currentInstallment: 0,
      isApplied: false,
    },
  });
}

export function generateDeductionData(
  employeeId: string,
  data?: {
    name?: string;
    amount?: number;
    reason?: string;
    isRecurring?: boolean;
    installments?: number;
  },
) {
  return {
    employeeId,
    name: data?.name ?? `Deduction-${Date.now()}`,
    amount: data?.amount ?? 500,
    reason: data?.reason ?? 'Salary advance',
    date: new Date().toISOString(),
    isRecurring: data?.isRecurring ?? false,
    installments: data?.installments,
  };
}
