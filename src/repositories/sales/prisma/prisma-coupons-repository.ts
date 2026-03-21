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

export class PrismaCouponsRepository implements CouponsRepository {
  async create(data: CreateCouponSchema): Promise<Coupon> {
    const record = await prisma.coupon.create({
      data: {
        tenantId: data.tenantId,
        code: data.code.toUpperCase(),
        description: data.description ?? null,
        discountType: data.discountType,
        discountValue: data.discountValue,
        applicableTo: data.applicableTo,
        minOrderValue: data.minOrderValue ?? null,
        maxDiscountAmount: data.maxDiscountAmount ?? null,
        maxUsageTotal: data.maxUsageTotal ?? null,
        maxUsagePerCustomer: data.maxUsagePerCustomer ?? null,
        currentUsageTotal: 0,
        startDate: data.startDate ?? null,
        endDate: data.endDate ?? null,
        isActive: data.isActive ?? true,
      },
    });

    return Coupon.create(
      {
        tenantId: new EntityID(record.tenantId),
        code: record.code,
        description: record.description ?? undefined,
        discountType: record.discountType as Coupon['discountType'],
        discountValue: Number(record.discountValue),
        applicableTo: record.applicableTo as Coupon['applicableTo'],
        isActive: record.isActive,
        currentUsageTotal: record.currentUsageTotal,
        createdAt: record.createdAt,
        updatedAt: record.updatedAt,
      },
      new EntityID(record.id),
    );
  }

  async findById(
    id: UniqueEntityID,
    tenantId: string,
  ): Promise<Coupon | null> {
    const record = await prisma.coupon.findUnique({
      where: { id: id.toString(), tenantId, deletedAt: null },
    });

    if (!record) return null;

    return Coupon.create(
      {
        tenantId: new EntityID(record.tenantId),
        code: record.code,
        description: record.description ?? undefined,
        discountType: record.discountType as Coupon['discountType'],
        discountValue: Number(record.discountValue),
        applicableTo: record.applicableTo as Coupon['applicableTo'],
        isActive: record.isActive,
        currentUsageTotal: record.currentUsageTotal,
        createdAt: record.createdAt,
        updatedAt: record.updatedAt,
      },
      new EntityID(record.id),
    );
  }

  async findByCode(code: string, tenantId: string): Promise<Coupon | null> {
    const record = await prisma.coupon.findFirst({
      where: {
        code: { equals: code.toUpperCase(), mode: 'insensitive' },
        tenantId,
        deletedAt: null,
      },
    });

    if (!record) return null;

    return Coupon.create(
      {
        tenantId: new EntityID(record.tenantId),
        code: record.code,
        description: record.description ?? undefined,
        discountType: record.discountType as Coupon['discountType'],
        discountValue: Number(record.discountValue),
        applicableTo: record.applicableTo as Coupon['applicableTo'],
        isActive: record.isActive,
        currentUsageTotal: record.currentUsageTotal,
        createdAt: record.createdAt,
        updatedAt: record.updatedAt,
      },
      new EntityID(record.id),
    );
  }

  async findManyPaginated(
    params: FindManyCouponsParams,
  ): Promise<PaginatedResult<Coupon>> {
    const where: Record<string, unknown> = {
      tenantId: params.tenantId,
      deletedAt: null,
    };

    if (params.isActive !== undefined) where.isActive = params.isActive;
    if (params.search) {
      where.OR = [
        { code: { contains: params.search, mode: 'insensitive' } },
        { description: { contains: params.search, mode: 'insensitive' } },
      ];
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

    const data = records.map((r) =>
      Coupon.create(
        {
          tenantId: new EntityID(r.tenantId),
          code: r.code,
          description: r.description ?? undefined,
          discountType: r.discountType as Coupon['discountType'],
          discountValue: Number(r.discountValue),
          applicableTo: r.applicableTo as Coupon['applicableTo'],
          isActive: r.isActive,
          currentUsageTotal: r.currentUsageTotal,
          createdAt: r.createdAt,
          updatedAt: r.updatedAt,
        },
        new EntityID(r.id),
      ),
    );

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

    return Coupon.create(
      {
        tenantId: new EntityID(record.tenantId),
        code: record.code,
        description: record.description ?? undefined,
        discountType: record.discountType as Coupon['discountType'],
        discountValue: Number(record.discountValue),
        applicableTo: record.applicableTo as Coupon['applicableTo'],
        isActive: record.isActive,
        currentUsageTotal: record.currentUsageTotal,
        createdAt: record.createdAt,
        updatedAt: record.updatedAt,
      },
      new EntityID(record.id),
    );
  }

  async delete(id: UniqueEntityID, tenantId: string): Promise<void> {
    await prisma.coupon.update({
      where: { id: id.toString(), tenantId },
      data: { deletedAt: new Date() },
    });
  }

  async incrementUsage(id: UniqueEntityID, tenantId: string): Promise<void> {
    await prisma.coupon.update({
      where: { id: id.toString(), tenantId },
      data: { currentUsageTotal: { increment: 1 } },
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
          customerId: usage.customerId.toString(),
          orderId: usage.orderId?.toString() ?? null,
          discountApplied: usage.discountApplied,
          usedAt: usage.usedAt,
        },
      }),
      prisma.coupon.update({
        where: { id: couponId.toString(), tenantId },
        data: { currentUsageTotal: { increment: 1 } },
      }),
    ]);
  }
}
