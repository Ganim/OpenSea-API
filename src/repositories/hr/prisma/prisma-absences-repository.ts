import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import { Absence } from '@/entities/hr/absence';
import { prisma } from '@/lib/prisma';
import { mapAbsencePrismaToDomain } from '@/mappers/hr/absence';
import { ENCRYPTED_FIELD_CONFIG } from '@/services/security/encrypted-field-config';
import { getFieldCipherService } from '@/services/security/field-cipher-service';
import type { AbsenceStatus, AbsenceType } from '@prisma/generated/client.js';
import type {
  AbsencesRepository,
  CreateAbsenceSchema,
  FindAbsenceFilters,
  PaginatedAbsencesResult,
  UpdateAbsenceSchema,
} from '../absences-repository';

const { encryptedFields } = ENCRYPTED_FIELD_CONFIG.Absence;

function tryGetCipher() {
  try {
    return getFieldCipherService();
  } catch {
    return null;
  }
}

function decryptAbsenceData<T extends Record<string, unknown>>(data: T): T {
  const cipher = tryGetCipher();
  if (!cipher) return data;
  return cipher.decryptFields(data, encryptedFields);
}

function decryptAndMap(absenceData: Record<string, unknown>) {
  const decrypted = decryptAbsenceData(absenceData);
  return mapAbsencePrismaToDomain(decrypted as never);
}

export class PrismaAbsencesRepository implements AbsencesRepository {
  async create(data: CreateAbsenceSchema): Promise<Absence> {
    const cipher = tryGetCipher();

    const cidEncrypted =
      data.cid && cipher ? cipher.encrypt(data.cid) : data.cid;

    const absenceData = await prisma.absence.create({
      data: {
        tenantId: data.tenantId,
        employeeId: data.employeeId.toString(),
        type: data.type as AbsenceType,
        status: 'PENDING',
        startDate: data.startDate,
        endDate: data.endDate,
        totalDays: data.totalDays,
        reason: data.reason,
        documentUrl: data.documentUrl,
        cid: cidEncrypted,
        isPaid: data.isPaid,
        isInssResponsibility: data.isInssResponsibility ?? false,
        vacationPeriodId: data.vacationPeriodId?.toString(),
        requestedBy: data.requestedBy?.toString(),
        notes: data.notes,
      },
    });

    const absence = Absence.create(
      decryptAndMap(absenceData as unknown as Record<string, unknown>),
      new UniqueEntityID(absenceData.id),
    );
    return absence;
  }

  async findById(
    id: UniqueEntityID,
    tenantId: string,
  ): Promise<Absence | null> {
    const absenceData = await prisma.absence.findUnique({
      where: { id: id.toString(), tenantId, deletedAt: null },
    });

    if (!absenceData) return null;

    const absence = Absence.create(
      decryptAndMap(absenceData as unknown as Record<string, unknown>),
      new UniqueEntityID(absenceData.id),
    );
    return absence;
  }

  async findMany(
    tenantId: string,
    filters?: FindAbsenceFilters,
  ): Promise<Absence[]> {
    const absences = await prisma.absence.findMany({
      where: {
        tenantId,
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
        decryptAndMap(item as unknown as Record<string, unknown>),
        new UniqueEntityID(item.id),
      ),
    );
  }

  async findManyPaginated(
    tenantId: string,
    filters: FindAbsenceFilters,
    skip: number,
    take: number,
  ): Promise<PaginatedAbsencesResult> {
    const whereClause = {
      tenantId,
      deletedAt: null,
      employeeId: filters.employeeId?.toString(),
      type: filters.type as AbsenceType | undefined,
      status: filters.status as AbsenceStatus | undefined,
      startDate: filters.startDate ? { gte: filters.startDate } : undefined,
      endDate: filters.endDate ? { lte: filters.endDate } : undefined,
    };

    const [absencesData, total] = await Promise.all([
      prisma.absence.findMany({
        where: whereClause,
        orderBy: { startDate: 'desc' },
        skip,
        take,
      }),
      prisma.absence.count({ where: whereClause }),
    ]);

    const absences = absencesData.map((item) =>
      Absence.create(
        decryptAndMap(item as unknown as Record<string, unknown>),
        new UniqueEntityID(item.id),
      ),
    );

    return { absences, total };
  }

  async findManyByEmployee(
    employeeId: UniqueEntityID,
    tenantId: string,
  ): Promise<Absence[]> {
    const absences = await prisma.absence.findMany({
      where: {
        employeeId: employeeId.toString(),
        tenantId,
        deletedAt: null,
      },
      orderBy: { startDate: 'desc' },
    });

    return absences.map((item) =>
      Absence.create(
        decryptAndMap(item as unknown as Record<string, unknown>),
        new UniqueEntityID(item.id),
      ),
    );
  }

  async findManyByEmployeeAndDateRange(
    employeeId: UniqueEntityID,
    startDate: Date,
    endDate: Date,
    tenantId: string,
  ): Promise<Absence[]> {
    const absences = await prisma.absence.findMany({
      where: {
        employeeId: employeeId.toString(),
        tenantId,
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
        decryptAndMap(item as unknown as Record<string, unknown>),
        new UniqueEntityID(item.id),
      ),
    );
  }

  async findManyByStatus(status: string, tenantId: string): Promise<Absence[]> {
    const absences = await prisma.absence.findMany({
      where: {
        status: status as AbsenceStatus,
        tenantId,
        deletedAt: null,
      },
      orderBy: { startDate: 'desc' },
    });

    return absences.map((item) =>
      Absence.create(
        decryptAndMap(item as unknown as Record<string, unknown>),
        new UniqueEntityID(item.id),
      ),
    );
  }

  async findManyPending(tenantId: string): Promise<Absence[]> {
    return this.findManyByStatus('PENDING', tenantId);
  }

  async findOverlapping(
    employeeId: UniqueEntityID,
    startDate: Date,
    endDate: Date,
    tenantId: string,
    excludeId?: UniqueEntityID,
  ): Promise<Absence[]> {
    const absences = await prisma.absence.findMany({
      where: {
        employeeId: employeeId.toString(),
        tenantId,
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
        decryptAndMap(item as unknown as Record<string, unknown>),
        new UniqueEntityID(item.id),
      ),
    );
  }

  async countByEmployeeAndType(
    employeeId: UniqueEntityID,
    type: string,
    year: number,
    tenantId: string,
  ): Promise<number> {
    const startOfYear = new Date(year, 0, 1);
    const endOfYear = new Date(year, 11, 31);

    return prisma.absence.count({
      where: {
        employeeId: employeeId.toString(),
        tenantId,
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
    tenantId: string,
  ): Promise<number> {
    const startOfYear = new Date(year, 0, 1);
    const endOfYear = new Date(year, 11, 31);

    const result = await prisma.absence.aggregate({
      _sum: { totalDays: true },
      where: {
        employeeId: employeeId.toString(),
        tenantId,
        type: type as AbsenceType,
        deletedAt: null,
        status: { notIn: ['REJECTED', 'CANCELLED'] },
        startDate: { gte: startOfYear, lte: endOfYear },
      },
    });

    return result._sum?.totalDays ?? 0;
  }

  async update(data: UpdateAbsenceSchema): Promise<Absence | null> {
    const existingAbsence = await prisma.absence.findFirst({
      where: {
        id: data.id.toString(),
        ...(data.tenantId && { tenantId: data.tenantId }),
      },
      select: { id: true },
    });

    if (!existingAbsence) return null;

    const cipher = tryGetCipher();

    const cidEncrypted =
      data.cid !== undefined
        ? data.cid && cipher
          ? cipher.encrypt(data.cid)
          : data.cid
        : undefined;

    const absenceData = await prisma.absence.update({
      where: {
        id: data.id.toString(),
        ...(data.tenantId && { tenantId: data.tenantId }),
      },
      data: {
        startDate: data.startDate,
        endDate: data.endDate,
        type: data.type as AbsenceType | undefined,
        totalDays: data.totalDays,
        status: data.status as AbsenceStatus | undefined,
        reason: data.reason,
        documentUrl: data.documentUrl,
        cid: cidEncrypted,
        isPaid: data.isPaid,
        isInssResponsibility: data.isInssResponsibility,
        approvedBy: data.approvedBy?.toString(),
        approvedAt: data.approvedAt,
        rejectionReason: data.rejectionReason,
        notes: data.notes,
      },
    });

    const absence = Absence.create(
      decryptAndMap(absenceData as unknown as Record<string, unknown>),
      new UniqueEntityID(absenceData.id),
    );
    return absence;
  }

  async save(absence: Absence): Promise<void> {
    const cipher = tryGetCipher();

    const cidEncrypted =
      absence.cid && cipher ? cipher.encrypt(absence.cid) : absence.cid;

    await prisma.absence.update({
      where: { id: absence.id.toString(), tenantId: absence.tenantId.toString(), },
      data: {
        status: absence.status.value,
        reason: absence.reason,
        documentUrl: absence.documentUrl,
        cid: cidEncrypted,
        approvedBy: absence.approvedBy?.toString(),
        approvedAt: absence.approvedAt,
        rejectionReason: absence.rejectionReason,
        notes: absence.notes,
        updatedAt: absence.updatedAt,
      },
    });
  }

  async delete(id: UniqueEntityID, tenantId?: string): Promise<void> {
    await prisma.absence.update({
      where: {
        id: id.toString(),
        ...(tenantId && { tenantId }),
      },
      data: { deletedAt: new Date() },
    });
  }
}
