import { prisma } from '@/lib/prisma';
import { faker } from '@faker-js/faker';
import type { AbsenceStatus, AbsenceType } from '@prisma/generated/client.js';

interface CreateAbsenceE2EProps {
  employeeId: string;
  type?: AbsenceType;
  status?: AbsenceStatus;
  startDate?: Date;
  endDate?: Date;
  totalDays?: number;
  reason?: string;
  documentUrl?: string;
  cid?: string;
  isPaid?: boolean;
  isInssResponsibility?: boolean;
  vacationPeriodId?: string;
  requestedBy?: string;
  approvedBy?: string;
  approvedAt?: Date;
  rejectionReason?: string;
  notes?: string;
}

/**
 * Gera um código CID válido aleatório
 */
export function generateCIDCode(): string {
  const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  const letter = letters[Math.floor(Math.random() * letters.length)];
  const number = faker.number
    .int({ min: 0, max: 99 })
    .toString()
    .padStart(2, '0');
  return `${letter}${number}`;
}

/**
 * Cria uma ausência no banco de dados para testes E2E
 */
export async function createAbsenceE2E(override: CreateAbsenceE2EProps) {
  const startDate = override.startDate ?? faker.date.future();
  const endDate =
    override.endDate ?? new Date(startDate.getTime() + 5 * 24 * 60 * 60 * 1000); // 5 dias depois

  // Calculate total days
  const start = new Date(startDate);
  start.setHours(0, 0, 0, 0);
  const end = new Date(endDate);
  end.setHours(0, 0, 0, 0);
  const diffTime = Math.abs(end.getTime() - start.getTime());
  const totalDays =
    override.totalDays ?? Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;

  const absence = await prisma.absence.create({
    data: {
      employeeId: override.employeeId,
      type: override.type ?? 'VACATION',
      status: override.status ?? 'PENDING',
      startDate,
      endDate,
      totalDays,
      reason: override.reason ?? faker.lorem.sentence(),
      documentUrl: override.documentUrl,
      cid: override.cid,
      isPaid: override.isPaid ?? true,
      isInssResponsibility: override.isInssResponsibility ?? false,
      vacationPeriodId: override.vacationPeriodId,
      requestedBy: override.requestedBy,
      approvedBy: override.approvedBy,
      approvedAt: override.approvedAt,
      rejectionReason: override.rejectionReason,
      notes: override.notes,
    },
  });

  return {
    absence,
    absenceId: absence.id,
  };
}

/**
 * Cria uma ausência do tipo férias
 */
export async function createVacationAbsenceE2E(
  override: CreateAbsenceE2EProps,
) {
  return createAbsenceE2E({
    ...override,
    type: 'VACATION',
    isPaid: true,
  });
}

/**
 * Cria uma ausência do tipo atestado médico
 */
export async function createSickLeaveAbsenceE2E(
  override: CreateAbsenceE2EProps,
) {
  const startDate = override.startDate ?? faker.date.past();
  const totalDays = override.totalDays ?? faker.number.int({ min: 1, max: 30 });
  const endDate =
    override.endDate ??
    new Date(startDate.getTime() + (totalDays - 1) * 24 * 60 * 60 * 1000);

  return createAbsenceE2E({
    ...override,
    type: 'SICK_LEAVE',
    isPaid: true,
    cid: override.cid ?? generateCIDCode(),
    documentUrl: override.documentUrl ?? faker.internet.url(),
    isInssResponsibility: totalDays > 15,
    startDate,
    endDate,
    totalDays,
  });
}

/**
 * Cria uma ausência aprovada
 */
export async function createApprovedAbsenceE2E(
  override: CreateAbsenceE2EProps & { approvedBy: string },
) {
  return createAbsenceE2E({
    ...override,
    status: 'APPROVED',
    approvedAt: override.approvedAt ?? new Date(),
  });
}

/**
 * Cria uma ausência rejeitada
 */
export async function createRejectedAbsenceE2E(
  override: CreateAbsenceE2EProps & { approvedBy: string },
) {
  return createAbsenceE2E({
    ...override,
    status: 'REJECTED',
    approvedAt: override.approvedAt ?? new Date(),
    rejectionReason: override.rejectionReason ?? faker.lorem.sentence(),
  });
}

/**
 * Gera dados para criação de ausência via API
 */
export function generateAbsenceData(
  override: Partial<{
    type: AbsenceType;
    startDate: Date;
    endDate: Date;
    reason: string;
    documentUrl: string;
    cid: string;
    notes: string;
  }> = {},
) {
  const startDate = override.startDate ?? faker.date.future();
  const endDate =
    override.endDate ?? new Date(startDate.getTime() + 5 * 24 * 60 * 60 * 1000);

  return {
    type: override.type ?? 'VACATION',
    startDate: startDate.toISOString(),
    endDate: endDate.toISOString(),
    reason: override.reason ?? faker.lorem.sentence(),
    documentUrl: override.documentUrl,
    cid: override.cid,
    notes: override.notes,
  };
}

/**
 * Gera dados para solicitação de férias via API
 */
export function generateVacationRequestData(
  override: Partial<{
    startDate: Date;
    endDate: Date;
    reason: string;
    notes: string;
  }> = {},
) {
  const startDate = override.startDate ?? faker.date.future({ years: 1 });
  const endDate =
    override.endDate ??
    new Date(startDate.getTime() + 29 * 24 * 60 * 60 * 1000); // 30 dias

  return {
    startDate: startDate.toISOString(),
    endDate: endDate.toISOString(),
    reason: override.reason ?? 'Solicitação de férias',
    notes: override.notes,
  };
}

/**
 * Gera dados para solicitação de atestado médico via API
 */
export function generateSickLeaveRequestData(
  override: Partial<{
    startDate: Date;
    endDate: Date;
    reason: string;
    cid: string;
    documentUrl: string;
    notes: string;
  }> = {},
) {
  const startDate = override.startDate ?? new Date();
  const endDate =
    override.endDate ?? new Date(startDate.getTime() + 2 * 24 * 60 * 60 * 1000); // 3 dias

  return {
    startDate: startDate.toISOString(),
    endDate: endDate.toISOString(),
    reason: override.reason ?? 'Atestado médico',
    cid: override.cid ?? generateCIDCode(),
    documentUrl: override.documentUrl ?? faker.internet.url(),
    notes: override.notes,
  };
}
