import type { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import type { PaymentCondition } from '@/entities/sales/payment-condition';
import { prisma } from '@/lib/prisma';
import { paymentConditionPrismaToDomain } from '@/mappers/sales/payment-condition/payment-condition-prisma-to-domain';
import type { PaginatedResult } from '@/repositories/pagination-params';
import type {
  FindManyPaymentConditionsParams,
  PaymentConditionsRepository,
} from '../payment-conditions-repository';
import type {
  PaymentConditionType as PrismaType,
  InterestType as PrismaInterestType,
  PaymentConditionApplicable as PrismaApplicable,
} from '@prisma/generated/client.js';

export class PrismaPaymentConditionsRepository
  implements PaymentConditionsRepository
{
  async create(condition: PaymentCondition): Promise<void> {
    await prisma.paymentCondition.create({
      data: {
        id: condition.id.toString(),
        tenantId: condition.tenantId.toString(),
        name: condition.name,
        description: condition.description ?? null,
        type: condition.type as PrismaType,
        installments: condition.installments,
        firstDueDays: condition.firstDueDays,
        intervalDays: condition.intervalDays,
        downPaymentPercent: condition.downPaymentPercent ?? null,
        interestRate: condition.interestRate ?? null,
        interestType: condition.interestType as PrismaInterestType,
        penaltyRate: condition.penaltyRate ?? null,
        discountCash: condition.discountCash ?? null,
        applicableTo: condition.applicableTo as PrismaApplicable,
        minOrderValue: condition.minOrderValue ?? null,
        maxOrderValue: condition.maxOrderValue ?? null,
        isActive: condition.isActive,
        isDefault: condition.isDefault,
        createdAt: condition.createdAt,
      },
    });
  }

  async findById(
    id: UniqueEntityID,
    tenantId: string,
  ): Promise<PaymentCondition | null> {
    const data = await prisma.paymentCondition.findFirst({
      where: {
        id: id.toString(),
        tenantId,
        deletedAt: null,
      },
    });

    if (!data) return null;
    return paymentConditionPrismaToDomain(data);
  }

  async findDefault(tenantId: string): Promise<PaymentCondition | null> {
    const data = await prisma.paymentCondition.findFirst({
      where: {
        tenantId,
        isDefault: true,
        isActive: true,
        deletedAt: null,
      },
    });

    if (!data) return null;
    return paymentConditionPrismaToDomain(data);
  }

  async findManyPaginated(
    params: FindManyPaymentConditionsParams,
  ): Promise<PaginatedResult<PaymentCondition>> {
    const where: Record<string, unknown> = {
      tenantId: params.tenantId,
      deletedAt: null,
    };

    if (params.type) where.type = params.type;
    if (params.isActive !== undefined) where.isActive = params.isActive;
    if (params.search) {
      where.name = { contains: params.search, mode: 'insensitive' };
    }

    const [data, total] = await Promise.all([
      prisma.paymentCondition.findMany({
        where: where as never,
        skip: (params.page - 1) * params.limit,
        take: params.limit,
        orderBy: { name: 'asc' },
      }),
      prisma.paymentCondition.count({ where: where as never }),
    ]);

    return {
      data: data.map((d) => paymentConditionPrismaToDomain(d)),
      total,
      page: params.page,
      limit: params.limit,
      totalPages: Math.ceil(total / params.limit),
    };
  }

  async save(condition: PaymentCondition): Promise<void> {
    await prisma.paymentCondition.update({
      where: { id: condition.id.toString() },
      data: {
        name: condition.name,
        description: condition.description ?? null,
        installments: condition.installments,
        isActive: condition.isActive,
        isDefault: condition.isDefault,
        deletedAt: condition.deletedAt ?? null,
      },
    });
  }

  async delete(id: UniqueEntityID, _tenantId: string): Promise<void> {
    await prisma.paymentCondition.update({
      where: { id: id.toString() },
      data: { deletedAt: new Date() },
    });
  }
}
