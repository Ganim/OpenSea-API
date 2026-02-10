import { prisma } from '@/lib/prisma';
import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import { Consortium } from '@/entities/finance/consortium';
import { Prisma, type ConsortiumStatus } from '@prisma/generated/client.js';
import type {
  ConsortiaRepository,
  CreateConsortiumSchema,
  UpdateConsortiumSchema,
  FindManyConsortiaOptions,
  FindManyConsortiaResult,
} from '../consortia-repository';

function consortiumPrismaToDomain(raw: {
  id: string;
  tenantId: string;
  bankAccountId: string;
  costCenterId: string;
  name: string;
  administrator: string;
  groupNumber: string | null;
  quotaNumber: string | null;
  contractNumber: string | null;
  status: string;
  creditValue: Prisma.Decimal;
  monthlyPayment: Prisma.Decimal;
  totalInstallments: number;
  paidInstallments: number;
  isContemplated: boolean;
  contemplatedAt: Date | null;
  contemplationType: string | null;
  startDate: Date;
  endDate: Date | null;
  paymentDay: number | null;
  notes: string | null;
  metadata: Prisma.JsonValue;
  createdAt: Date;
  updatedAt: Date;
  deletedAt: Date | null;
}): Consortium {
  return Consortium.create(
    {
      id: new UniqueEntityID(raw.id),
      tenantId: new UniqueEntityID(raw.tenantId),
      bankAccountId: new UniqueEntityID(raw.bankAccountId),
      costCenterId: new UniqueEntityID(raw.costCenterId),
      name: raw.name,
      administrator: raw.administrator,
      groupNumber: raw.groupNumber ?? undefined,
      quotaNumber: raw.quotaNumber ?? undefined,
      contractNumber: raw.contractNumber ?? undefined,
      status: raw.status,
      creditValue: Number(raw.creditValue),
      monthlyPayment: Number(raw.monthlyPayment),
      totalInstallments: raw.totalInstallments,
      paidInstallments: raw.paidInstallments,
      isContemplated: raw.isContemplated,
      contemplatedAt: raw.contemplatedAt ?? undefined,
      contemplationType: raw.contemplationType ?? undefined,
      startDate: raw.startDate,
      endDate: raw.endDate ?? undefined,
      paymentDay: raw.paymentDay ?? undefined,
      notes: raw.notes ?? undefined,
      metadata: (raw.metadata as Record<string, unknown>) ?? {},
      createdAt: raw.createdAt,
      updatedAt: raw.updatedAt,
      deletedAt: raw.deletedAt ?? undefined,
    },
    new UniqueEntityID(raw.id),
  );
}

export class PrismaConsortiaRepository implements ConsortiaRepository {
  async create(data: CreateConsortiumSchema): Promise<Consortium> {
    const consortium = await prisma.consortium.create({
      data: {
        tenantId: data.tenantId,
        bankAccountId: data.bankAccountId,
        costCenterId: data.costCenterId,
        name: data.name,
        administrator: data.administrator,
        groupNumber: data.groupNumber,
        quotaNumber: data.quotaNumber,
        contractNumber: data.contractNumber,
        creditValue: new Prisma.Decimal(data.creditValue),
        monthlyPayment: new Prisma.Decimal(data.monthlyPayment),
        totalInstallments: data.totalInstallments,
        paidInstallments: data.paidInstallments ?? 0,
        isContemplated: data.isContemplated ?? false,
        startDate: data.startDate,
        endDate: data.endDate,
        paymentDay: data.paymentDay,
        notes: data.notes,
        metadata: (data.metadata ?? {}) as Record<string, never>,
      },
    });

    return consortiumPrismaToDomain(consortium);
  }

  async findById(
    id: UniqueEntityID,
    tenantId: string,
  ): Promise<Consortium | null> {
    const consortium = await prisma.consortium.findFirst({
      where: {
        id: id.toString(),
        tenantId,
        deletedAt: null,
      },
    });

    if (!consortium) return null;
    return consortiumPrismaToDomain(consortium);
  }

  async findMany(
    options: FindManyConsortiaOptions,
  ): Promise<FindManyConsortiaResult> {
    const page = options.page ?? 1;
    const limit = options.limit ?? 20;

    const where: Prisma.ConsortiumWhereInput = {
      tenantId: options.tenantId,
      deletedAt: null,
    };

    if (options.bankAccountId) where.bankAccountId = options.bankAccountId;
    if (options.costCenterId) where.costCenterId = options.costCenterId;
    if (options.status) where.status = options.status as ConsortiumStatus;
    if (options.isContemplated !== undefined)
      where.isContemplated = options.isContemplated;

    if (options.search) {
      where.OR = [
        { name: { contains: options.search, mode: 'insensitive' } },
        { administrator: { contains: options.search, mode: 'insensitive' } },
        { contractNumber: { contains: options.search, mode: 'insensitive' } },
      ];
    }

    const [consortia, total] = await Promise.all([
      prisma.consortium.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.consortium.count({ where }),
    ]);

    return {
      consortia: consortia.map(consortiumPrismaToDomain),
      total,
    };
  }

  async update(data: UpdateConsortiumSchema): Promise<Consortium | null> {
    const consortium = await prisma.consortium.update({
      where: { id: data.id.toString() },
      data: {
        ...(data.name !== undefined && { name: data.name }),
        ...(data.administrator !== undefined && {
          administrator: data.administrator,
        }),
        ...(data.contractNumber !== undefined && {
          contractNumber: data.contractNumber,
        }),
        ...(data.status !== undefined && {
          status: data.status as ConsortiumStatus,
        }),
        ...(data.paidInstallments !== undefined && {
          paidInstallments: data.paidInstallments,
        }),
        ...(data.isContemplated !== undefined && {
          isContemplated: data.isContemplated,
        }),
        ...(data.contemplatedAt !== undefined && {
          contemplatedAt: data.contemplatedAt,
        }),
        ...(data.contemplationType !== undefined && {
          contemplationType: data.contemplationType,
        }),
        ...(data.notes !== undefined && { notes: data.notes }),
        ...(data.endDate !== undefined && { endDate: data.endDate }),
      },
    });

    return consortiumPrismaToDomain(consortium);
  }

  async delete(id: UniqueEntityID): Promise<void> {
    await prisma.consortium.update({
      where: { id: id.toString() },
      data: { deletedAt: new Date() },
    });
  }
}
