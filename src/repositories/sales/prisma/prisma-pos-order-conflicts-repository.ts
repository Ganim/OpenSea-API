import type { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import type { PosOrderConflict } from '@/entities/sales/pos-order-conflict';
import { prisma } from '@/lib/prisma';
import type { TransactionClient } from '@/lib/transaction-manager';
import { posOrderConflictPrismaToDomain } from '@/mappers/sales/pos-order-conflict/pos-order-conflict-prisma-to-domain';
import type { PaginatedResult } from '@/repositories/pagination-params';

import type {
  FindManyPosOrderConflictsParams,
  PosOrderConflictsRepository,
} from '../pos-order-conflicts-repository';

import type {
  Prisma,
  PosOrderConflictStatus as PrismaPosOrderConflictStatus,
} from '@prisma/generated/client.js';

export class PrismaPosOrderConflictsRepository
  implements PosOrderConflictsRepository
{
  async create(
    conflict: PosOrderConflict,
    tx?: TransactionClient,
  ): Promise<void> {
    const client = tx ?? prisma;
    await client.posOrderConflict.create({
      data: {
        id: conflict.id.toString(),
        tenantId: conflict.tenantId,
        saleLocalUuid: conflict.saleLocalUuid,
        orderId: conflict.orderId ?? null,
        posTerminalId: conflict.posTerminalId,
        posSessionId: conflict.posSessionId ?? null,
        posOperatorEmployeeId: conflict.posOperatorEmployeeId ?? null,
        status: conflict.status.value as PrismaPosOrderConflictStatus,
        conflictDetails:
          conflict.conflictDetails as unknown as Prisma.InputJsonValue,
        resolutionDetails:
          (conflict.resolutionDetails as Prisma.InputJsonValue) ?? undefined,
        resolvedByUserId: conflict.resolvedByUserId ?? null,
        resolvedAt: conflict.resolvedAt ?? null,
        createdAt: conflict.createdAt,
        updatedAt: conflict.updatedAt ?? new Date(),
      },
    });
  }

  async save(
    conflict: PosOrderConflict,
    tx?: TransactionClient,
  ): Promise<void> {
    const client = tx ?? prisma;
    await client.posOrderConflict.update({
      where: { id: conflict.id.toString() },
      data: {
        orderId: conflict.orderId ?? null,
        posSessionId: conflict.posSessionId ?? null,
        posOperatorEmployeeId: conflict.posOperatorEmployeeId ?? null,
        status: conflict.status.value as PrismaPosOrderConflictStatus,
        conflictDetails:
          conflict.conflictDetails as unknown as Prisma.InputJsonValue,
        resolutionDetails:
          (conflict.resolutionDetails as Prisma.InputJsonValue) ?? undefined,
        resolvedByUserId: conflict.resolvedByUserId ?? null,
        resolvedAt: conflict.resolvedAt ?? null,
        updatedAt: conflict.updatedAt ?? new Date(),
      },
    });
  }

  async findById(
    id: UniqueEntityID,
    tenantId: string,
  ): Promise<PosOrderConflict | null> {
    const raw = await prisma.posOrderConflict.findFirst({
      where: { id: id.toString(), tenantId },
    });
    return raw ? posOrderConflictPrismaToDomain(raw) : null;
  }

  async findBySaleLocalUuid(
    saleLocalUuid: string,
    tenantId: string,
  ): Promise<PosOrderConflict | null> {
    const raw = await prisma.posOrderConflict.findFirst({
      where: { saleLocalUuid, tenantId },
    });
    return raw ? posOrderConflictPrismaToDomain(raw) : null;
  }

  async findManyPaginated(
    params: FindManyPosOrderConflictsParams,
  ): Promise<PaginatedResult<PosOrderConflict>> {
    const where: Record<string, unknown> = { tenantId: params.tenantId };

    if (params.status && params.status.length > 0) {
      where.status = { in: params.status };
    }

    if (params.posTerminalId) {
      where.posTerminalId = params.posTerminalId;
    }

    if (params.operatorEmployeeId) {
      where.posOperatorEmployeeId = params.operatorEmployeeId;
    }

    if (params.fromDate || params.toDate) {
      const createdAt: Record<string, Date> = {};
      if (params.fromDate) createdAt.gte = params.fromDate;
      if (params.toDate) createdAt.lte = params.toDate;
      where.createdAt = createdAt;
    }

    const [data, total] = await Promise.all([
      prisma.posOrderConflict.findMany({
        where: where as Prisma.PosOrderConflictWhereInput,
        skip: (params.page - 1) * params.limit,
        take: params.limit,
        orderBy: { createdAt: 'desc' },
      }),
      prisma.posOrderConflict.count({
        where: where as Prisma.PosOrderConflictWhereInput,
      }),
    ]);

    return {
      data: data.map(posOrderConflictPrismaToDomain),
      total,
      page: params.page,
      limit: params.limit,
      totalPages: Math.ceil(total / params.limit),
    };
  }
}
