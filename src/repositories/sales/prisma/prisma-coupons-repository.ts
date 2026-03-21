import type { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import { UniqueEntityID as EntityID } from '@/entities/domain/unique-entity-id';
import { Coupon, type CouponUsageProps } from '@/entities/sales/coupon';
import { prisma } from '@/lib/prisma';
import type { PaginatedResult } from '@/repositories/pagination-params';
import type {
  CouponsRepository,
  CreateCouponSchema,
  FindManyCouponsParams,
  UpdateCouponSchema,
} from '../coupons-repository';

// Map Prisma Coupon record to domain entity.
// The Prisma model uses `type`/`value`/`applicableTo`/`usageCount`
// while the domain entity uses `discountType`/`discountValue`/`applicableTo`/`currentUsageTotal`.
function mapToDomain(record: any): Coupon {
  return Coupon.create(
    {
      tenantId: new EntityID(record.tenantId),
      code: record.code,
      discountType: record.type as Coupon['discountType'],
      discountValue: Number(record.value),
      applicableTo: record.applicableTo as Coupon['applicableTo'],
      isActive: record.isActive,
      currentUsageTotal: record.usageCount ?? 0,
      createdAt: record.createdAt,
      updatedAt: record.updatedAt,
    },
    new EntityID(record.id),
  );
}

export class PrismaCouponsRepository implements CouponsRepository {
  async create(data: CreateCouponSchema): Promise<Coupon> {
    const record = await prisma.coupon.create({
      data: {
        tenantId: data.tenantId,
        code: data.code.toUpperCase(),
        type: data.discountType as any,
        value: data.discountValue,
        applicableTo: (data.applicableTo as any) ?? 'ALL',
        minOrderValue: data.minOrderValue ?? null,
        maxDiscount: data.maxDiscountAmount ?? null,
        maxUsageTotal: data.maxUsageTotal ?? null,
        maxUsagePerCustomer: data.maxUsagePerCustomer ?? 1,
        validFrom: data.startDate ?? new Date(),
        validUntil: data.endDate ?? new Date(),
        isActive: data.isActive ?? true,
      },
    });

    return mapToDomain(record);
  }

  async findById(
    id: UniqueEntityID,
    tenantId: string,
  ): Promise<Coupon | null> {
    const record = await prisma.coupon.findFirst({
      where: { id: id.toString(), tenantId },
    });

    if (!record) return null;
    return mapToDomain(record);
  }

  async findByCode(code: string, tenantId: string): Promise<Coupon | null> {
    const record = await prisma.coupon.findFirst({
      where: {
        code: { equals: code.toUpperCase(), mode: 'insensitive' },
        tenantId,
      },
    });

    if (!record) return null;
    return mapToDomain(record);
  }

  async findManyPaginated(
    params: FindManyCouponsParams,
  ): Promise<PaginatedResult<Coupon>> {
    const where: Record<string, unknown> = {
      tenantId: params.tenantId,
    };

    if (params.isActive !== undefined) where.isActive = params.isActive;
    if (params.search) {
      where.code = { contains: params.search, mode: 'insensitive' };
    }

    const [records, total] = await Promise.all([
      prisma.coupon.findMany({
        where,
        skip: (params.page - 1) * params.limit,
        take: params.limit,
        orderBy: { [params.sortBy ?? 'createdAt']: params.sortOrder ?? 'desc' },
      }),
      prisma.coupon.count({ where }),
    ]);

    const data = records.map((r) => mapToDomain(r));

    return {
      data,
      total,
      page: params.page,
      limit: params.limit,
      totalPages: Math.ceil(total / params.limit),
    };
  }

  async update(data: UpdateCouponSchema): Promise<Coupon | null> {
    const updateData: Record<string, unknown> = {};
    if (data.code !== undefined) updateData.code = data.code.toUpperCase();
    if (data.description !== undefined) updateData.description = data.description;
    if (data.isActive !== undefined) updateData.isActive = data.isActive;

    const record = await prisma.coupon.update({
      where: { id: data.id.toString() },
      data: updateData,
    });

    return mapToDomain(record);
  }

  async delete(id: UniqueEntityID, tenantId: string): Promise<void> {
    await prisma.coupon.update({
      where: { id: id.toString() },
      data: { isActive: false },
    });
  }

  async incrementUsage(id: UniqueEntityID, tenantId: string): Promise<void> {
    await prisma.coupon.update({
      where: { id: id.toString() },
      data: { usageCount: { increment: 1 } },
    });
  }

  async recordUsage(
    couponId: UniqueEntityID,
    tenantId: string,
    usage: CouponUsageProps,
  ): Promise<void> {
    await prisma.$transaction([
      prisma.couponUsage.create({
        data: {
          couponId: couponId.toString(),
          tenantId,
          customerId: usage.customerId.toString(),
          orderId: usage.orderId?.toString() ?? null,
          discountApplied: usage.discountApplied,
          usedAt: usage.usedAt,
        },
      }),
      prisma.coupon.update({
        where: { id: couponId.toString() },
        data: { usageCount: { increment: 1 } },
      }),
    ]);
  }
}
