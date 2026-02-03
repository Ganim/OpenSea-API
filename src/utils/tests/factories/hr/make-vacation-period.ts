import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import { VacationPeriod } from '@/entities/hr/vacation-period';
import { VacationStatus } from '@/entities/hr/value-objects';
import { faker } from '@faker-js/faker';

interface MakeVacationPeriodProps {
  tenantId?: UniqueEntityID;
  employeeId?: UniqueEntityID;
  acquisitionStart?: Date;
  acquisitionEnd?: Date;
  concessionStart?: Date;
  concessionEnd?: Date;
  totalDays?: number;
  usedDays?: number;
  soldDays?: number;
  remainingDays?: number;
  status?: VacationStatus;
  scheduledStart?: Date;
  scheduledEnd?: Date;
  notes?: string;
}

/**
 * Cria uma instância de VacationPeriod para testes unitários
 */
export function makeVacationPeriod(
  override: MakeVacationPeriodProps = {},
  id?: UniqueEntityID,
): VacationPeriod {
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

  return VacationPeriod.create(
    {
      tenantId: override.tenantId ?? new UniqueEntityID(),
      employeeId: override.employeeId ?? new UniqueEntityID(),
      acquisitionStart,
      acquisitionEnd,
      concessionStart,
      concessionEnd,
      totalDays,
      usedDays,
      soldDays,
      remainingDays,
      status: override.status ?? VacationStatus.pending(),
      scheduledStart: override.scheduledStart,
      scheduledEnd: override.scheduledEnd,
      notes: override.notes,
    },
    id,
  );
}

/**
 * Cria um período de férias com status AVAILABLE
 */
export function makeAvailableVacationPeriod(
  override: MakeVacationPeriodProps = {},
  id?: UniqueEntityID,
): VacationPeriod {
  return makeVacationPeriod(
    {
      ...override,
      status: VacationStatus.available(),
    },
    id,
  );
}

/**
 * Cria um período de férias com status SCHEDULED
 */
export function makeScheduledVacationPeriod(
  override: MakeVacationPeriodProps = {},
  id?: UniqueEntityID,
): VacationPeriod {
  const scheduledStart = override.scheduledStart ?? faker.date.future();
  const scheduledEnd =
    override.scheduledEnd ??
    new Date(scheduledStart.getTime() + 29 * 24 * 60 * 60 * 1000); // 30 dias depois

  return makeVacationPeriod(
    {
      ...override,
      status: VacationStatus.scheduled(),
      scheduledStart,
      scheduledEnd,
    },
    id,
  );
}

/**
 * Cria um período de férias com status IN_PROGRESS
 */
export function makeInProgressVacationPeriod(
  override: MakeVacationPeriodProps = {},
  id?: UniqueEntityID,
): VacationPeriod {
  const now = new Date();
  const scheduledStart = new Date(now.getTime() - 5 * 24 * 60 * 60 * 1000); // 5 dias atrás
  const scheduledEnd = new Date(now.getTime() + 25 * 24 * 60 * 60 * 1000); // 25 dias depois

  return makeVacationPeriod(
    {
      ...override,
      status: VacationStatus.inProgress(),
      scheduledStart: override.scheduledStart ?? scheduledStart,
      scheduledEnd: override.scheduledEnd ?? scheduledEnd,
    },
    id,
  );
}

/**
 * Cria um período de férias com status COMPLETED
 */
export function makeCompletedVacationPeriod(
  override: MakeVacationPeriodProps = {},
  id?: UniqueEntityID,
): VacationPeriod {
  return makeVacationPeriod(
    {
      ...override,
      status: VacationStatus.completed(),
      usedDays: override.usedDays ?? 30,
      remainingDays: 0,
    },
    id,
  );
}

/**
 * Cria um período de férias com status EXPIRED
 */
export function makeExpiredVacationPeriod(
  override: MakeVacationPeriodProps = {},
  id?: UniqueEntityID,
): VacationPeriod {
  // Dates in the past (expired)
  const acquisitionStart = new Date();
  acquisitionStart.setFullYear(acquisitionStart.getFullYear() - 3);

  const acquisitionEnd = new Date(acquisitionStart);
  acquisitionEnd.setFullYear(acquisitionEnd.getFullYear() + 1);
  acquisitionEnd.setDate(acquisitionEnd.getDate() - 1);

  const concessionStart = new Date(acquisitionEnd);
  concessionStart.setDate(concessionStart.getDate() + 1);

  const concessionEnd = new Date(concessionStart);
  concessionEnd.setFullYear(concessionEnd.getFullYear() + 1);
  concessionEnd.setDate(concessionEnd.getDate() - 1);

  return makeVacationPeriod(
    {
      ...override,
      status: VacationStatus.expired(),
      acquisitionStart: override.acquisitionStart ?? acquisitionStart,
      acquisitionEnd: override.acquisitionEnd ?? acquisitionEnd,
      concessionStart: override.concessionStart ?? concessionStart,
      concessionEnd: override.concessionEnd ?? concessionEnd,
    },
    id,
  );
}

/**
 * Cria um período de férias a partir de uma data de contratação
 */
export function makeVacationPeriodFromHireDate(
  tenantId: UniqueEntityID,
  employeeId: UniqueEntityID,
  hireDate: Date,
  totalDays: number = 30,
  id?: UniqueEntityID,
): VacationPeriod {
  return VacationPeriod.createFromHireDate(
    tenantId,
    employeeId,
    hireDate,
    totalDays,
    id,
  );
}
