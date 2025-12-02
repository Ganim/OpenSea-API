import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import { Absence } from '@/entities/hr/absence';
import { AbsenceStatus, AbsenceType } from '@/entities/hr/value-objects';
import { faker } from '@faker-js/faker';

interface MakeAbsenceProps {
  employeeId?: UniqueEntityID;
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
  vacationPeriodId?: UniqueEntityID;
  requestedBy?: UniqueEntityID;
  approvedBy?: UniqueEntityID;
  approvedAt?: Date;
  rejectionReason?: string;
  notes?: string;
}

/**
 * Cria uma instância de Absence para testes unitários
 */
export function makeAbsence(
  override: MakeAbsenceProps = {},
  id?: UniqueEntityID,
): Absence {
  const startDate = override.startDate ?? faker.date.future();
  const endDate =
    override.endDate ?? new Date(startDate.getTime() + 5 * 24 * 60 * 60 * 1000); // 5 dias depois
  const totalDays =
    override.totalDays ?? Absence.calculateTotalDays(startDate, endDate);

  return Absence.create(
    {
      employeeId: override.employeeId ?? new UniqueEntityID(),
      type: override.type ?? AbsenceType.vacation(),
      status: override.status ?? AbsenceStatus.pending(),
      startDate,
      endDate,
      totalDays,
      reason: override.reason ?? faker.lorem.sentence(),
      documentUrl: override.documentUrl,
      cid: override.cid,
      isPaid: override.isPaid ?? true,
      isInssResponsibility: override.isInssResponsibility,
      vacationPeriodId: override.vacationPeriodId,
      requestedBy: override.requestedBy,
      approvedBy: override.approvedBy,
      approvedAt: override.approvedAt,
      rejectionReason: override.rejectionReason,
      notes: override.notes,
    },
    id,
  );
}

/**
 * Cria uma ausência do tipo férias
 */
export function makeVacationAbsence(
  override: MakeAbsenceProps = {},
  id?: UniqueEntityID,
): Absence {
  return makeAbsence(
    {
      ...override,
      type: AbsenceType.vacation(),
      isPaid: true,
    },
    id,
  );
}

/**
 * Cria uma ausência do tipo atestado médico
 */
export function makeSickLeaveAbsence(
  override: MakeAbsenceProps = {},
  id?: UniqueEntityID,
): Absence {
  const startDate = override.startDate ?? faker.date.past();
  const totalDays = override.totalDays ?? faker.number.int({ min: 1, max: 30 });
  const endDate =
    override.endDate ??
    new Date(startDate.getTime() + (totalDays - 1) * 24 * 60 * 60 * 1000);

  return makeAbsence(
    {
      ...override,
      type: AbsenceType.sickLeave(),
      isPaid: true,
      cid: override.cid ?? generateCIDCode(),
      documentUrl: override.documentUrl ?? faker.internet.url(),
      isInssResponsibility: totalDays > 15,
      startDate,
      endDate,
      totalDays,
    },
    id,
  );
}

/**
 * Cria uma ausência do tipo licença maternidade
 */
export function makeMaternityLeaveAbsence(
  override: MakeAbsenceProps = {},
  id?: UniqueEntityID,
): Absence {
  const startDate = override.startDate ?? faker.date.future();
  const totalDays = 120; // 120 dias é o padrão
  const endDate = new Date(
    startDate.getTime() + (totalDays - 1) * 24 * 60 * 60 * 1000,
  );

  return makeAbsence(
    {
      ...override,
      type: AbsenceType.maternityLeave(),
      isPaid: true,
      isInssResponsibility: true,
      startDate,
      endDate,
      totalDays,
    },
    id,
  );
}

/**
 * Cria uma ausência do tipo licença paternidade
 */
export function makePaternityLeaveAbsence(
  override: MakeAbsenceProps = {},
  id?: UniqueEntityID,
): Absence {
  const startDate = override.startDate ?? faker.date.future();
  const totalDays = 20; // 20 dias na empresa cidadã
  const endDate = new Date(
    startDate.getTime() + (totalDays - 1) * 24 * 60 * 60 * 1000,
  );

  return makeAbsence(
    {
      ...override,
      type: AbsenceType.paternityLeave(),
      isPaid: true,
      startDate,
      endDate,
      totalDays,
    },
    id,
  );
}

/**
 * Cria uma ausência aprovada
 */
export function makeApprovedAbsence(
  override: MakeAbsenceProps = {},
  id?: UniqueEntityID,
): Absence {
  return makeAbsence(
    {
      ...override,
      status: AbsenceStatus.approved(),
      approvedBy: override.approvedBy ?? new UniqueEntityID(),
      approvedAt: override.approvedAt ?? new Date(),
    },
    id,
  );
}

/**
 * Cria uma ausência rejeitada
 */
export function makeRejectedAbsence(
  override: MakeAbsenceProps = {},
  id?: UniqueEntityID,
): Absence {
  return makeAbsence(
    {
      ...override,
      status: AbsenceStatus.rejected(),
      approvedBy: override.approvedBy ?? new UniqueEntityID(),
      approvedAt: override.approvedAt ?? new Date(),
      rejectionReason: override.rejectionReason ?? faker.lorem.sentence(),
    },
    id,
  );
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
