import { prisma } from '@/lib/prisma';

export async function createBonus(
  employeeId: string,
  data?: {
    name?: string;
    amount?: number;
    reason?: string;
    date?: Date;
  },
) {
  return prisma.bonus.create({
    data: {
      employeeId,
      name: data?.name ?? 'Test Bonus',
      amount: data?.amount ?? 1000,
      reason: data?.reason ?? 'Performance bonus',
      date: data?.date ?? new Date(),
      isPaid: false,
    },
  });
}

export function generateBonusData(
  employeeId: string,
  data?: {
    name?: string;
    amount?: number;
    reason?: string;
  },
) {
  return {
    employeeId,
    name: data?.name ?? `Bonus-${Date.now()}`,
    amount: data?.amount ?? 1000,
    reason: data?.reason ?? 'Performance bonus',
    date: new Date().toISOString(),
  };
}
