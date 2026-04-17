import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import { PPEAssignment } from '@/entities/hr/ppe-assignment';
import { prisma } from '@/lib/prisma';
import type { TransactionClient } from '@/lib/transaction-manager';
import { mapPPEAssignmentPrismaToDomain } from '@/mappers/hr/ppe-assignment';
import type {
  PPEAssignmentsRepository,
  CreatePPEAssignmentSchema,
  FindPPEAssignmentFilters,
  FindExpiringAssignmentFilters,
  ReturnPPEAssignmentSchema,
} from '../ppe-assignments-repository';

export class PrismaPPEAssignmentsRepository
  implements PPEAssignmentsRepository
{
  async create(
    data: CreatePPEAssignmentSchema,
    tx?: TransactionClient,
  ): Promise<PPEAssignment> {
    const client = tx ?? prisma;
    const record = await client.pPEAssignment.create({
      data: {
        tenantId: data.tenantId,
        ppeItemId: data.ppeItemId,
        employeeId: data.employeeId,
        assignedAt: data.assignedAt ?? new Date(),
        expiresAt: data.expiresAt,
        condition: data.condition ?? 'NEW',
        quantity: data.quantity,
        notes: data.notes,
        status: 'ACTIVE',
      },
    });

    return PPEAssignment.create(
      mapPPEAssignmentPrismaToDomain(record),
      new UniqueEntityID(record.id),
    );
  }

  async findById(
    id: UniqueEntityID,
    tenantId: string,
  ): Promise<PPEAssignment | null> {
    const record = await prisma.pPEAssignment.findFirst({
      where: { id: id.toString(), tenantId },
    });

    if (!record) return null;

    return PPEAssignment.create(
      mapPPEAssignmentPrismaToDomain(record),
      new UniqueEntityID(record.id),
    );
  }

  async findMany(
    tenantId: string,
    filters?: FindPPEAssignmentFilters,
  ): Promise<{ assignments: PPEAssignment[]; total: number }> {
    const page = filters?.page ?? 1;
    const perPage = Math.min(filters?.perPage ?? 20, 100);
    const skip = (page - 1) * perPage;

    const where: Record<string, unknown> = { tenantId };

    if (filters?.employeeId) {
      where.employeeId = filters.employeeId;
    }

    if (filters?.ppeItemId) {
      where.ppeItemId = filters.ppeItemId;
    }

    if (filters?.status) {
      where.status = filters.status;
    }

    const [records, total] = await Promise.all([
      prisma.pPEAssignment.findMany({
        where,
        orderBy: { assignedAt: 'desc' },
        skip,
        take: perPage,
      }),
      prisma.pPEAssignment.count({ where }),
    ]);

    return {
      assignments: records.map((record) =>
        PPEAssignment.create(
          mapPPEAssignmentPrismaToDomain(record),
          new UniqueEntityID(record.id),
        ),
      ),
      total,
    };
  }

  async findExpiring(
    tenantId: string,
    filters: FindExpiringAssignmentFilters,
  ): Promise<{ assignments: PPEAssignment[]; total: number }> {
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + filters.daysAhead);

    const page = filters?.page ?? 1;
    const perPage = Math.min(filters?.perPage ?? 20, 100);
    const skip = (page - 1) * perPage;

    const where = {
      tenantId,
      status: 'ACTIVE',
      expiresAt: { lte: futureDate },
    };

    const [records, total] = await Promise.all([
      prisma.pPEAssignment.findMany({
        where,
        orderBy: { expiresAt: 'asc' },
        skip,
        take: perPage,
      }),
      prisma.pPEAssignment.count({ where }),
    ]);

    return {
      assignments: records.map((record) =>
        PPEAssignment.create(
          mapPPEAssignmentPrismaToDomain(record),
          new UniqueEntityID(record.id),
        ),
      ),
      total,
    };
  }

  async returnAssignment(
    data: ReturnPPEAssignmentSchema,
  ): Promise<PPEAssignment | null> {
    const existing = await prisma.pPEAssignment.findUnique({
      where: {
        id: data.id.toString(),
        ...(data.tenantId && { tenantId: data.tenantId }),
      },
    });

    if (!existing || existing.status !== 'ACTIVE') return null;

    const record = await prisma.pPEAssignment.update({
      where: {
        id: data.id.toString(),
        ...(data.tenantId && { tenantId: data.tenantId }),
      },
      data: {
        returnedAt: new Date(),
        returnCondition: data.returnCondition,
        status: 'RETURNED',
        notes: data.notes ?? existing.notes,
      },
    });

    return PPEAssignment.create(
      mapPPEAssignmentPrismaToDomain(record),
      new UniqueEntityID(record.id),
    );
  }
}
