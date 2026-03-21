import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import { CustomerPrice } from '@/entities/sales/customer-price';
import { prisma } from '@/lib/prisma';
import type { PaginatedResult } from '@/repositories/pagination-params';
import type {
  CreateCustomerPriceSchema,
  CustomerPricesRepository,
  FindManyCustomerPricesParams,
  UpdateCustomerPriceSchema,
} from '../customer-prices-repository';

function mapToDomain(data: Record<string, unknown>): CustomerPrice {
  return CustomerPrice.create(
    {
      tenantId: new UniqueEntityID(data.tenantId as string),
      customerId: new UniqueEntityID(data.customerId as string),
      variantId: new UniqueEntityID(data.variantId as string),
      price: Number(data.price),
      validFrom: (data.validFrom as Date) ?? undefined,
      validUntil: (data.validUntil as Date) ?? undefined,
      notes: (data.notes as string) ?? undefined,
      createdByUserId: new UniqueEntityID(data.createdByUserId as string),
      createdAt: data.createdAt as Date,
      updatedAt: (data.updatedAt as Date) ?? undefined,
    },
    new UniqueEntityID(data.id as string),
  );
}

export class PrismaCustomerPricesRepository implements CustomerPricesRepository {
  async create(data: CreateCustomerPriceSchema): Promise<CustomerPrice> {
    const result = await prisma.customerPrice.create({
      data: {
        tenantId: data.tenantId,
        customerId: data.customerId,
        variantId: data.variantId,
        price: data.price,
        validFrom: data.validFrom,
        validUntil: data.validUntil,
        notes: data.notes,
        createdByUserId: data.createdByUserId,
      },
    });

    return mapToDomain(result as unknown as Record<string, unknown>);
  }

  async findById(
    id: UniqueEntityID,
    tenantId: string,
  ): Promise<CustomerPrice | null> {
    const result = await prisma.customerPrice.findFirst({
      where: {
        id: id.toString(),
        tenantId,
      },
    });

    if (!result) return null;
    return mapToDomain(result as unknown as Record<string, unknown>);
  }

  async findByCustomerAndVariant(
    customerId: string,
    variantId: string,
    tenantId: string,
  ): Promise<CustomerPrice | null> {
    const result = await prisma.customerPrice.findFirst({
      where: {
        customerId,
        variantId,
        tenantId,
      },
    });

    if (!result) return null;
    return mapToDomain(result as unknown as Record<string, unknown>);
  }

  async findManyByCustomer(
    params: FindManyCustomerPricesParams,
  ): Promise<PaginatedResult<CustomerPrice>> {
    const where = {
      tenantId: params.tenantId,
      customerId: params.customerId,
    };

    const [results, total] = await Promise.all([
      prisma.customerPrice.findMany({
        where,
        skip: (params.page - 1) * params.limit,
        take: params.limit,
        orderBy: {
          [params.sortBy ?? 'createdAt']: params.sortOrder ?? 'desc',
        },
      }),
      prisma.customerPrice.count({ where }),
    ]);

    return {
      data: results.map((r) =>
        mapToDomain(r as unknown as Record<string, unknown>),
      ),
      total,
      page: params.page,
      limit: params.limit,
      totalPages: Math.ceil(total / params.limit),
    };
  }

  async update(data: UpdateCustomerPriceSchema): Promise<CustomerPrice | null> {
    try {
      const updateData: Record<string, unknown> = {};

      if (data.price !== undefined) updateData.price = data.price;
      if (data.validFrom !== undefined) updateData.validFrom = data.validFrom;
      if (data.validUntil !== undefined) updateData.validUntil = data.validUntil;
      if (data.notes !== undefined) updateData.notes = data.notes;

      const result = await prisma.customerPrice.update({
        where: { id: data.id.toString() },
        data: updateData,
      });

      return mapToDomain(result as unknown as Record<string, unknown>);
    } catch {
      return null;
    }
  }

  async delete(id: UniqueEntityID, _tenantId: string): Promise<void> {
    await prisma.customerPrice.delete({
      where: { id: id.toString() },
    });
  }
}
