import { prisma } from '@/lib/prisma';
import { faker } from '@faker-js/faker';

interface CreateVacationPeriodE2EProps {
  tenantId: string;
  employeeId: string;
  acquisitionStart?: Date;
  acquisitionEnd?: Date;
  concessionStart?: Date;
  concessionEnd?: Date;
  totalDays?: number;
  usedDays?: number;
  soldDays?: number;
  remainingDays?: number;
  status?: string;
  scheduledStart?: Date;
  scheduledEnd?: Date;
  notes?: string;
}

/**
 * Cria um período de férias no banco de dados para testes E2E
 */
export async function createVacationPeriodE2E(
  override: CreateVacationPeriodE2EProps,
) {
  // Calculate dates if not provided
  const acquisitionStart =
    override.acquisitionStart ?? faker.date.past({ years: 2 });
  const acquisitionEnd =
    override.acquisitionEnd ??
    new Date(
      acquisitionStart.getFullYear() + 1,
      acquisitionStart.getMonth(),
      acquisitionStart.getDate() - 1,
    );
  const concessionStart =
    override.concessionStart ??
    new Date(
      acquisitionEnd.getFullYear(),
      acquisitionEnd.getMonth(),
      acquisitionEnd.getDate() + 1,
    );
  const concessionEnd =
    override.concessionEnd ??
    new Date(
      concessionStart.getFullYear() + 1,
      concessionStart.getMonth(),
      concessionStart.getDate() - 1,
    );

  const totalDays = override.totalDays ?? 30;
  const usedDays = override.usedDays ?? 0;
  const soldDays = override.soldDays ?? 0;
  const remainingDays =
    override.remainingDays ?? totalDays - usedDays - soldDays;

  const vacationPeriod = await prisma.vacationPeriod.create({
    data: {
      tenantId: override.tenantId,
      employeeId: override.employeeId,
      acquisitionStart,
      acquisitionEnd,
      concessionStart,
      concessionEnd,
      totalDays,
      usedDays,
      soldDays,
      remainingDays,
      status: override.status ?? 'PENDING',
      scheduledStart: override.scheduledStart,
      scheduledEnd: override.scheduledEnd,
      notes: override.notes,
    },
  });

  return {
    vacationPeriod,
    vacationPeriodId: vacationPeriod.id,
  };
}

/**
 * Cria um período de férias com status AVAILABLE
 */
export async function createAvailableVacationPeriodE2E(
  override: CreateVacationPeriodE2EProps,
) {
  return createVacationPeriodE2E({
    ...override,
    status: 'AVAILABLE',
  });
}

/**
 * Cria um período de férias com status SCHEDULED
 */
export async function createScheduledVacationPeriodE2E(
  override: CreateVacationPeriodE2EProps,
) {
  const scheduledStart = override.scheduledStart ?? faker.date.future();
  const scheduledEnd =
    override.scheduledEnd ??
    new Date(scheduledStart.getTime() + 29 * 24 * 60 * 60 * 1000); // 30 dias depois

  return createVacationPeriodE2E({
    ...override,
    status: 'SCHEDULED',
    scheduledStart,
    scheduledEnd,
  });
}

/**
 * Cria um período de férias com status IN_PROGRESS
 */
export async function createInProgressVacationPeriodE2E(
  override: CreateVacationPeriodE2EProps,
) {
  const now = new Date();
  const scheduledStart = new Date(now.getTime() - 5 * 24 * 60 * 60 * 1000); // 5 dias atrás
  const scheduledEnd = new Date(now.getTime() + 25 * 24 * 60 * 60 * 1000); // 25 dias depois

  return createVacationPeriodE2E({
    ...override,
    status: 'IN_PROGRESS',
    scheduledStart: override.scheduledStart ?? scheduledStart,
    scheduledEnd: override.scheduledEnd ?? scheduledEnd,
  });
}

/**
 * Cria um período de férias com status COMPLETED
 */
export async function createCompletedVacationPeriodE2E(
  override: CreateVacationPeriodE2EProps,
) {
  return createVacationPeriodE2E({
    ...override,
    status: 'COMPLETED',
    usedDays: override.usedDays ?? 30,
    remainingDays: 0,
  });
}

/**
 * Cria um período de férias a partir de uma data de contratação
 */
export async function createVacationPeriodFromHireDateE2E(
  tenantId: string,
  employeeId: string,
  hireDate: Date,
  totalDays: number = 30,
) {
  const acquisitionStart = new Date(hireDate);
  const acquisitionEnd = new Date(hireDate);
  acquisitionEnd.setFullYear(acquisitionEnd.getFullYear() + 1);
  acquisitionEnd.setDate(acquisitionEnd.getDate() - 1);

  const concessionStart = new Date(acquisitionEnd);
  concessionStart.setDate(concessionStart.getDate() + 1);
  const concessionEnd = new Date(concessionStart);
  concessionEnd.setFullYear(concessionEnd.getFullYear() + 1);
  concessionEnd.setDate(concessionEnd.getDate() - 1);

  return createVacationPeriodE2E({
    tenantId,
    employeeId,
    acquisitionStart,
    acquisitionEnd,
    concessionStart,
    concessionEnd,
    totalDays,
    usedDays: 0,
    soldDays: 0,
    remainingDays: totalDays,
    status: 'PENDING',
  });
}

/**
 * Gera dados para criação de período de férias via API
 */
export function generateVacationPeriodData(
  override: Partial<{
    acquisitionStart: Date;
    acquisitionEnd: Date;
    concessionStart: Date;
    concessionEnd: Date;
    totalDays: number;
    notes: string;
  }> = {},
) {
  const acquisitionStart =
    override.acquisitionStart ?? faker.date.past({ years: 2 });
  const acquisitionEnd =
    override.acquisitionEnd ??
    new Date(
      acquisitionStart.getFullYear() + 1,
      acquisitionStart.getMonth(),
      acquisitionStart.getDate() - 1,
    );
  const concessionStart =
    override.concessionStart ??
    new Date(
      acquisitionEnd.getFullYear(),
      acquisitionEnd.getMonth(),
      acquisitionEnd.getDate() + 1,
    );
  const concessionEnd =
    override.concessionEnd ??
    new Date(
      concessionStart.getFullYear() + 1,
      concessionStart.getMonth(),
      concessionStart.getDate() - 1,
    );

  return {
    acquisitionStart: acquisitionStart.toISOString(),
    acquisitionEnd: acquisitionEnd.toISOString(),
    concessionStart: concessionStart.toISOString(),
    concessionEnd: concessionEnd.toISOString(),
    totalDays: override.totalDays ?? 30,
    notes: override.notes,
  };
}

/**
 * Gera dados para agendamento de férias via API
 */
export function generateScheduleVacationData(
  override: Partial<{
    scheduledStart: Date;
    scheduledEnd: Date;
    days: number;
  }> = {},
) {
  const scheduledStart = override.scheduledStart ?? faker.date.future();
  const days = override.days ?? 30;
  const scheduledEnd =
    override.scheduledEnd ??
    new Date(scheduledStart.getTime() + (days - 1) * 24 * 60 * 60 * 1000);

  return {
    scheduledStart: scheduledStart.toISOString(),
    scheduledEnd: scheduledEnd.toISOString(),
    days,
  };
}

/**
 * Gera dados para venda de dias de férias via API
 */
export function generateSellVacationDaysData(
  override: Partial<{
    daysToSell: number;
  }> = {},
) {
  return {
    daysToSell: override.daysToSell ?? 10,
  };
}
