import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import { EmployeeWarning } from '@/entities/hr/employee-warning';
import { prisma } from '@/lib/prisma';
import { mapEmployeeWarningPrismaToDomain } from '@/mappers/hr/employee-warning';
import type {
  CreateEmployeeWarningSchema,
  EmployeeWarningsRepository,
  FindEmployeeWarningFilters,
  PaginatedEmployeeWarningsResult,
  SoftDeleteEmployeeWarningSchema,
  UpdateEmployeeWarningSchema,
} from '../employee-warnings-repository';

export class PrismaEmployeeWarningsRepository
  implements EmployeeWarningsRepository
{
  async create(data: CreateEmployeeWarningSchema): Promise<EmployeeWarning> {
    const warningData = await prisma.employeeWarning.create({
      data: {
        tenantId: data.tenantId,
        employeeId: data.employeeId.toString(),
        issuedBy: data.issuedBy.toString(),
        type: data.type,
        severity: data.severity,
        reason: data.reason,
        description: data.description,
        incidentDate: data.incidentDate,
        witnessName: data.witnessName,
        suspensionDays: data.suspensionDays,
        attachmentUrl: data.attachmentUrl,
        status: 'ACTIVE',
      },
    });

    return EmployeeWarning.create(
      mapEmployeeWarningPrismaToDomain(warningData),
      new UniqueEntityID(warningData.id),
    );
  }

  async findById(
    id: UniqueEntityID,
    tenantId: string,
    options?: { includeDeleted?: boolean },
  ): Promise<EmployeeWarning | null> {
    const includeDeleted = options?.includeDeleted ?? false;
    const warningData = await prisma.employeeWarning.findUnique({
      where: {
        id: id.toString(),
        tenantId,
        ...(includeDeleted ? {} : { deletedAt: null }),
      },
    });

    if (!warningData) return null;

    return EmployeeWarning.create(
      mapEmployeeWarningPrismaToDomain(warningData),
      new UniqueEntityID(warningData.id),
    );
  }

  async findManyPaginated(
    tenantId: string,
    filters: FindEmployeeWarningFilters,
    skip: number,
    take: number,
  ): Promise<PaginatedEmployeeWarningsResult> {
    const includeDeleted = filters.includeDeleted ?? false;
    const whereClause = {
      tenantId,
      ...(includeDeleted ? {} : { deletedAt: null }),
      employeeId: filters.employeeId?.toString(),
      type: filters.type,
      severity: filters.severity,
      status: filters.status,
    };

    const [warningsData, total] = await Promise.all([
      prisma.employeeWarning.findMany({
        where: whereClause,
        orderBy: { incidentDate: 'desc' },
        skip,
        take,
      }),
      prisma.employeeWarning.count({ where: whereClause }),
    ]);

    const warnings = warningsData.map((item) =>
      EmployeeWarning.create(
        mapEmployeeWarningPrismaToDomain(item),
        new UniqueEntityID(item.id),
      ),
    );

    return { warnings, total };
  }

  async findManyByEmployee(
    employeeId: UniqueEntityID,
    tenantId: string,
    options?: { includeDeleted?: boolean },
  ): Promise<EmployeeWarning[]> {
    const includeDeleted = options?.includeDeleted ?? false;
    const warningsData = await prisma.employeeWarning.findMany({
      where: {
        employeeId: employeeId.toString(),
        tenantId,
        ...(includeDeleted ? {} : { deletedAt: null }),
      },
      orderBy: { incidentDate: 'desc' },
    });

    return warningsData.map((item) =>
      EmployeeWarning.create(
        mapEmployeeWarningPrismaToDomain(item),
        new UniqueEntityID(item.id),
      ),
    );
  }

  async countActiveByEmployee(
    employeeId: UniqueEntityID,
    tenantId: string,
  ): Promise<number> {
    return prisma.employeeWarning.count({
      where: {
        employeeId: employeeId.toString(),
        tenantId,
        status: 'ACTIVE',
        deletedAt: null,
      },
    });
  }

  async softDelete(data: SoftDeleteEmployeeWarningSchema): Promise<void> {
    await prisma.employeeWarning.updateMany({
      where: {
        id: data.id.toString(),
        tenantId: data.tenantId,
        deletedAt: null,
      },
      data: {
        deletedAt: new Date(),
        deletedBy: data.deletedBy,
      },
    });
  }

  async update(
    data: UpdateEmployeeWarningSchema,
  ): Promise<EmployeeWarning | null> {
    const existing = await prisma.employeeWarning.findUnique({
      where: {
        id: data.id.toString(),
        ...(data.tenantId && { tenantId: data.tenantId }),
      },
    });

    if (!existing) return null;

    const warningData = await prisma.employeeWarning.update({
      where: {
        id: data.id.toString(),
        ...(data.tenantId && { tenantId: data.tenantId }),
      },
      data: {
        type: data.type,
        severity: data.severity,
        reason: data.reason,
        description: data.description,
        incidentDate: data.incidentDate,
        witnessName: data.witnessName,
        suspensionDays: data.suspensionDays,
        attachmentUrl: data.attachmentUrl,
      },
    });

    return EmployeeWarning.create(
      mapEmployeeWarningPrismaToDomain(warningData),
      new UniqueEntityID(warningData.id),
    );
  }

  async save(warning: EmployeeWarning): Promise<void> {
    await prisma.employeeWarning.update({
      where: {
        id: warning.id.toString(),
        tenantId: warning.tenantId.toString(),
      },
      data: {
        status: warning.status.value,
        employeeAcknowledged: warning.employeeAcknowledged,
        acknowledgedAt: warning.acknowledgedAt,
        revokedAt: warning.revokedAt,
        revokeReason: warning.revokeReason,
        updatedAt: warning.updatedAt,
      },
    });
  }
}
