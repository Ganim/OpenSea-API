import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import { VacationPeriod } from '@/entities/hr/vacation-period';
import { prisma } from '@/lib/prisma';
import { mapVacationPeriodPrismaToDomain } from '@/mappers/hr/vacation-period';
import type {
  CreateVacationPeriodSchema,
  FindVacationPeriodFilters,
  UpdateVacationPeriodSchema,
  VacationPeriodsRepository,
} from '../vacation-periods-repository';

export class PrismaVacationPeriodsRepository
  implements VacationPeriodsRepository
{
  async create(data: CreateVacationPeriodSchema): Promise<VacationPeriod> {
    const vacationPeriodData = await prisma.vacationPeriod.create({
      data: {
        tenantId: data.tenantId,
        employeeId: data.employeeId.toString(),
        acquisitionStart: data.acquisitionStart,
        acquisitionEnd: data.acquisitionEnd,
        concessionStart: data.concessionStart,
        concessionEnd: data.concessionEnd,
        totalDays: data.totalDays,
        usedDays: data.usedDays ?? 0,
        soldDays: data.soldDays ?? 0,
        remainingDays: data.remainingDays ?? data.totalDays,
        status: data.status ?? 'PENDING',
        notes: data.notes,
      },
    });

    const vacationPeriod = VacationPeriod.create(
      mapVacationPeriodPrismaToDomain(vacationPeriodData),
      new UniqueEntityID(vacationPeriodData.id),
    );
    return vacationPeriod;
  }

  async findById(
    id: UniqueEntityID,
    tenantId: string,
  ): Promise<VacationPeriod | null> {
    const vacationPeriodData = await prisma.vacationPeriod.findUnique({
      where: { id: id.toString(), tenantId, deletedAt: null },
    });

    if (!vacationPeriodData) return null;

    const vacationPeriod = VacationPeriod.create(
      mapVacationPeriodPrismaToDomain(vacationPeriodData),
      new UniqueEntityID(vacationPeriodData.id),
    );
    return vacationPeriod;
  }

  async findMany(
    tenantId: string,
    filters?: FindVacationPeriodFilters,
  ): Promise<VacationPeriod[]> {
    const whereClause: Record<string, unknown> = { tenantId, deletedAt: null };

    if (filters?.employeeId) {
      whereClause.employeeId = filters.employeeId.toString();
    }
    if (filters?.status) {
      whereClause.status = filters.status;
    }
    if (filters?.year) {
      const startOfYear = new Date(filters.year, 0, 1);
      const endOfYear = new Date(filters.year, 11, 31);
      whereClause.acquisitionStart = { lte: endOfYear };
      whereClause.concessionEnd = { gte: startOfYear };
    }

    const vacationPeriods = await prisma.vacationPeriod.findMany({
      where: whereClause,
      orderBy: { acquisitionStart: 'desc' },
    });

    return vacationPeriods.map((item) =>
      VacationPeriod.create(
        mapVacationPeriodPrismaToDomain(item),
        new UniqueEntityID(item.id),
      ),
    );
  }

  async findManyByEmployee(
    employeeId: UniqueEntityID,
    tenantId: string,
  ): Promise<VacationPeriod[]> {
    const vacationPeriods = await prisma.vacationPeriod.findMany({
      where: {
        employeeId: employeeId.toString(),
        tenantId,
        deletedAt: null,
      },
      orderBy: { acquisitionStart: 'desc' },
    });

    return vacationPeriods.map((item) =>
      VacationPeriod.create(
        mapVacationPeriodPrismaToDomain(item),
        new UniqueEntityID(item.id),
      ),
    );
  }

  async findManyByEmployeeAndStatus(
    employeeId: UniqueEntityID,
    status: string,
    tenantId: string,
  ): Promise<VacationPeriod[]> {
    const vacationPeriods = await prisma.vacationPeriod.findMany({
      where: {
        employeeId: employeeId.toString(),
        status,
        tenantId,
        deletedAt: null,
      },
      orderBy: { acquisitionStart: 'desc' },
    });

    return vacationPeriods.map((item) =>
      VacationPeriod.create(
        mapVacationPeriodPrismaToDomain(item),
        new UniqueEntityID(item.id),
      ),
    );
  }

  async findManyByStatus(
    status: string,
    tenantId: string,
  ): Promise<VacationPeriod[]> {
    const vacationPeriods = await prisma.vacationPeriod.findMany({
      where: {
        status,
        tenantId,
        deletedAt: null,
      },
      orderBy: { acquisitionStart: 'desc' },
    });

    return vacationPeriods.map((item) =>
      VacationPeriod.create(
        mapVacationPeriodPrismaToDomain(item),
        new UniqueEntityID(item.id),
      ),
    );
  }

  async findAvailableByEmployee(
    employeeId: UniqueEntityID,
    tenantId: string,
  ): Promise<VacationPeriod[]> {
    const vacationPeriods = await prisma.vacationPeriod.findMany({
      where: {
        employeeId: employeeId.toString(),
        tenantId,
        status: { in: ['AVAILABLE', 'SCHEDULED'] },
        remainingDays: { gt: 0 },
        deletedAt: null,
      },
      orderBy: { concessionEnd: 'asc' }, // Prioritize expiring first
    });

    return vacationPeriods.map((item) =>
      VacationPeriod.create(
        mapVacationPeriodPrismaToDomain(item),
        new UniqueEntityID(item.id),
      ),
    );
  }

  async findCurrentByEmployee(
    employeeId: UniqueEntityID,
    tenantId: string,
  ): Promise<VacationPeriod | null> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const vacationPeriod = await prisma.vacationPeriod.findFirst({
      where: {
        employeeId: employeeId.toString(),
        tenantId,
        status: 'PENDING',
        acquisitionEnd: { gte: today },
        deletedAt: null,
      },
      orderBy: { acquisitionStart: 'asc' },
    });

    if (!vacationPeriod) return null;

    return VacationPeriod.create(
      mapVacationPeriodPrismaToDomain(vacationPeriod),
      new UniqueEntityID(vacationPeriod.id),
    );
  }

  async findExpiring(
    beforeDate: Date,
    tenantId: string,
  ): Promise<VacationPeriod[]> {
    const vacationPeriods = await prisma.vacationPeriod.findMany({
      where: {
        tenantId,
        status: { in: ['AVAILABLE', 'SCHEDULED'] },
        concessionEnd: { lte: beforeDate },
        remainingDays: { gt: 0 },
        deletedAt: null,
      },
      orderBy: { concessionEnd: 'asc' },
    });

    return vacationPeriods.map((item) =>
      VacationPeriod.create(
        mapVacationPeriodPrismaToDomain(item),
        new UniqueEntityID(item.id),
      ),
    );
  }

  async update(
    data: UpdateVacationPeriodSchema,
  ): Promise<VacationPeriod | null> {
    const existingVacationPeriod = await prisma.vacationPeriod.findUnique({
      where: { id: data.id.toString() },
    });

    if (!existingVacationPeriod) return null;

    const vacationPeriodData = await prisma.vacationPeriod.update({
      where: { id: data.id.toString() },
      data: {
        usedDays: data.usedDays,
        soldDays: data.soldDays,
        remainingDays: data.remainingDays,
        status: data.status,
        scheduledStart: data.scheduledStart,
        scheduledEnd: data.scheduledEnd,
        notes: data.notes,
      },
    });

    const vacationPeriod = VacationPeriod.create(
      mapVacationPeriodPrismaToDomain(vacationPeriodData),
      new UniqueEntityID(vacationPeriodData.id),
    );
    return vacationPeriod;
  }

  async save(vacationPeriod: VacationPeriod): Promise<void> {
    await prisma.vacationPeriod.update({
      where: { id: vacationPeriod.id.toString() },
      data: {
        usedDays: vacationPeriod.usedDays,
        soldDays: vacationPeriod.soldDays,
        remainingDays: vacationPeriod.remainingDays,
        status: vacationPeriod.status.value,
        scheduledStart: vacationPeriod.scheduledStart,
        scheduledEnd: vacationPeriod.scheduledEnd,
        notes: vacationPeriod.notes,
        updatedAt: vacationPeriod.updatedAt,
      },
    });
  }

  async delete(id: UniqueEntityID): Promise<void> {
    await prisma.vacationPeriod.update({
      where: { id: id.toString() },
      data: { deletedAt: new Date() },
    });
  }
}
