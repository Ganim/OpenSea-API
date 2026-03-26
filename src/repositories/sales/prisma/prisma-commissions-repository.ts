import { prisma } from '@/lib/prisma';
import type { PaginatedResult } from '@/repositories/pagination-params';
import type {
  CommissionRecord,
  CommissionsRepository,
  FindManyCommissionsParams,
} from '../commissions-repository';

export class PrismaCommissionsRepository implements CommissionsRepository {
  async findManyPaginated(
    params: FindManyCommissionsParams,
  ): Promise<PaginatedResult<CommissionRecord>> {
    const where: Record<string, unknown> = {
      tenantId: params.tenantId,
    };

    if (params.status) {
      where.status = params.status;
    }

    if (params.userId) {
      where.userId = params.userId;
    }

    const [records, total] = await Promise.all([
      prisma.orderCommission.findMany({
        where,
        skip: (params.page - 1) * params.limit,
        take: params.limit,
        orderBy: { createdAt: 'desc' },
      }),
      prisma.orderCommission.count({ where }),
    ]);

    const commissions: CommissionRecord[] = records.map((record) => ({
      id: record.id,
      tenantId: record.tenantId,
      orderId: record.orderId,
      userId: record.userId,
      baseValue: Number(record.baseValue),
      commissionType: record.commissionType,
      commissionRate: Number(record.commissionRate),
      commissionValue: Number(record.commissionValue),
      status: record.status,
      paidAt: record.paidAt,
      financeEntryId: record.financeEntryId,
      createdAt: record.createdAt,
      updatedAt: record.updatedAt,
    }));

    return {
      data: commissions,
      total,
      page: params.page,
      limit: params.limit,
      totalPages: Math.ceil(total / params.limit),
    };
  }
}
