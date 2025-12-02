import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import { Absence } from '@/entities/hr/absence';
import { prisma } from '@/lib/prisma';
import { mapAbsencePrismaToDomain } from '@/mappers/hr/absence';
import type { AbsenceStatus, AbsenceType } from '@prisma/client';
import type {
  AbsencesRepository,
  CreateAbsenceSchema,
  FindAbsenceFilters,
  UpdateAbsenceSchema,
} from '../absences-repository';

export class PrismaAbsencesRepository implements AbsencesRepository {
  async create(data: CreateAbsenceSchema): Promise<Absence> {
    const absenceData = await prisma.absence.create({
      data: {
        employeeId: data.employeeId.toString(),
        type: data.type as AbsenceType,
        status: 'PENDING',
        startDate: data.startDate,
        endDate: data.endDate,
        totalDays: data.totalDays,
        reason: data.reason,
        documentUrl: data.documentUrl,
        cid: data.cid,
        isPaid: data.isPaid,
        isInssResponsibility: data.isInssResponsibility ?? false,
        vacationPeriodId: data.vacationPeriodId?.toString(),
        requestedBy: data.requestedBy?.toString(),
        notes: data.notes,
      },
    });

    const absence = Absence.create(
      mapAbsencePrismaToDomain(absenceData),
      new UniqueEntityID(absenceData.id),
    );
    return absence;
  }

  async findById(id: UniqueEntityID): Promise<Absence | null> {
    const absenceData = await prisma.absence.findUnique({
      where: { id: id.toString(), deletedAt: null },
    });

    if (!absenceData) return null;

    const absence = Absence.create(
      mapAbsencePrismaToDomain(absenceData),
      new UniqueEntityID(absenceData.id),
    );
    return absence;
  }

  async findMany(filters?: FindAbsenceFilters): Promise<Absence[]> {
    const absences = await prisma.absence.findMany({
      where: {
        deletedAt: null,
        employeeId: filters?.employeeId?.toString(),
        type: filters?.type as AbsenceType | undefined,
        status: filters?.status as AbsenceStatus | undefined,
        startDate: filters?.startDate ? { gte: filters.startDate } : undefined,
        endDate: filters?.endDate ? { lte: filters.endDate } : undefined,
      },
      orderBy: { startDate: 'desc' },
    });

    return absences.map((item) =>
      Absence.create(
        mapAbsencePrismaToDomain(item),
        new UniqueEntityID(item.id),
      ),
    );
  }

  async findManyByEmployee(employeeId: UniqueEntityID): Promise<Absence[]> {
    const absences = await prisma.absence.findMany({
      where: {
        employeeId: employeeId.toString(),
        deletedAt: null,
      },
      orderBy: { startDate: 'desc' },
    });

    return absences.map((item) =>
      Absence.create(
        mapAbsencePrismaToDomain(item),
        new UniqueEntityID(item.id),
      ),
    );
  }

  async findManyByEmployeeAndDateRange(
    employeeId: UniqueEntityID,
    startDate: Date,
    endDate: Date,
  ): Promise<Absence[]> {
    const absences = await prisma.absence.findMany({
      where: {
        employeeId: employeeId.toString(),
        deletedAt: null,
        OR: [
          {
            startDate: { gte: startDate, lte: endDate },
          },
          {
            endDate: { gte: startDate, lte: endDate },
          },
          {
            AND: [
              { startDate: { lte: startDate } },
              { endDate: { gte: endDate } },
            ],
          },
        ],
      },
      orderBy: { startDate: 'asc' },
    });

    return absences.map((item) =>
      Absence.create(
        mapAbsencePrismaToDomain(item),
        new UniqueEntityID(item.id),
      ),
    );
  }

  async findManyByStatus(status: string): Promise<Absence[]> {
    const absences = await prisma.absence.findMany({
      where: {
        status: status as AbsenceStatus,
        deletedAt: null,
      },
      orderBy: { startDate: 'desc' },
    });

    return absences.map((item) =>
      Absence.create(
        mapAbsencePrismaToDomain(item),
        new UniqueEntityID(item.id),
      ),
    );
  }

  async findManyPending(): Promise<Absence[]> {
    return this.findManyByStatus('PENDING');
  }

  async findOverlapping(
    employeeId: UniqueEntityID,
    startDate: Date,
    endDate: Date,
    excludeId?: UniqueEntityID,
  ): Promise<Absence[]> {
    const absences = await prisma.absence.findMany({
      where: {
        employeeId: employeeId.toString(),
        deletedAt: null,
        status: { notIn: ['REJECTED', 'CANCELLED'] },
        id: excludeId ? { not: excludeId.toString() } : undefined,
        OR: [
          {
            startDate: { gte: startDate, lte: endDate },
          },
          {
            endDate: { gte: startDate, lte: endDate },
          },
          {
            AND: [
              { startDate: { lte: startDate } },
              { endDate: { gte: endDate } },
            ],
          },
        ],
      },
    });

    return absences.map((item) =>
      Absence.create(
        mapAbsencePrismaToDomain(item),
        new UniqueEntityID(item.id),
      ),
    );
  }

  async countByEmployeeAndType(
    employeeId: UniqueEntityID,
    type: string,
    year: number,
  ): Promise<number> {
    const startOfYear = new Date(year, 0, 1);
    const endOfYear = new Date(year, 11, 31);

    return prisma.absence.count({
      where: {
        employeeId: employeeId.toString(),
        type: type as AbsenceType,
        deletedAt: null,
        status: { notIn: ['REJECTED', 'CANCELLED'] },
        startDate: { gte: startOfYear, lte: endOfYear },
      },
    });
  }

  async sumDaysByEmployeeAndType(
    employeeId: UniqueEntityID,
    type: string,
    year: number,
  ): Promise<number> {
    const startOfYear = new Date(year, 0, 1);
    const endOfYear = new Date(year, 11, 31);

    const result = await prisma.absence.aggregate({
      _sum: { totalDays: true },
      where: {
        employeeId: employeeId.toString(),
        type: type as AbsenceType,
        deletedAt: null,
        status: { notIn: ['REJECTED', 'CANCELLED'] },
        startDate: { gte: startOfYear, lte: endOfYear },
      },
    });

    return result._sum?.totalDays ?? 0;
  }

  async update(data: UpdateAbsenceSchema): Promise<Absence | null> {
    const existingAbsence = await prisma.absence.findUnique({
      where: { id: data.id.toString() },
    });

    if (!existingAbsence) return null;

    const absenceData = await prisma.absence.update({
      where: { id: data.id.toString() },
      data: {
        status: data.status as AbsenceStatus | undefined,
        reason: data.reason,
        documentUrl: data.documentUrl,
        cid: data.cid,
        approvedBy: data.approvedBy?.toString(),
        approvedAt: data.approvedAt,
        rejectionReason: data.rejectionReason,
        notes: data.notes,
      },
    });

    const absence = Absence.create(
      mapAbsencePrismaToDomain(absenceData),
      new UniqueEntityID(absenceData.id),
    );
    return absence;
  }

  async save(absence: Absence): Promise<void> {
    await prisma.absence.update({
      where: { id: absence.id.toString() },
      data: {
        status: absence.status.value,
        reason: absence.reason,
        documentUrl: absence.documentUrl,
        cid: absence.cid,
        approvedBy: absence.approvedBy?.toString(),
        approvedAt: absence.approvedAt,
        rejectionReason: absence.rejectionReason,
        notes: absence.notes,
        updatedAt: absence.updatedAt,
      },
    });
  }

  async delete(id: UniqueEntityID): Promise<void> {
    await prisma.absence.update({
      where: { id: id.toString() },
      data: { deletedAt: new Date() },
    });
  }
}
