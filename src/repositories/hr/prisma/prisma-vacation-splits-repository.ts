import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import {
  VacationSplit,
  type VacationSplitStatus,
} from '@/entities/hr/vacation-split';
import { prisma } from '@/lib/prisma';
import type {
  CreateVacationSplitSchema,
  VacationSplitsRepository,
} from '../vacation-splits-repository';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function mapPrismaToDomain(data: any): VacationSplit {
  return VacationSplit.create(
    {
      vacationPeriodId: new UniqueEntityID(data.vacationPeriodId),
      splitNumber: data.splitNumber,
      startDate: data.startDate,
      endDate: data.endDate,
      days: data.days,
      status: data.status as VacationSplitStatus,
      paymentDate: data.paymentDate ?? undefined,
      paymentAmount: data.paymentAmount
        ? Number(data.paymentAmount)
        : undefined,
      createdAt: data.createdAt,
      updatedAt: data.updatedAt,
    },
    new UniqueEntityID(data.id),
  );
}

export class PrismaVacationSplitsRepository
  implements VacationSplitsRepository
{
  async create(data: CreateVacationSplitSchema): Promise<VacationSplit> {
    const created = await prisma.vacationSplit.create({
      data: {
        vacationPeriodId: data.vacationPeriodId,
        splitNumber: data.splitNumber,
        startDate: data.startDate,
        endDate: data.endDate,
        days: data.days,
        status: data.status ?? 'SCHEDULED',
        paymentDate: data.paymentDate,
        paymentAmount: data.paymentAmount,
      },
    });

    return mapPrismaToDomain(created);
  }

  async findById(id: UniqueEntityID): Promise<VacationSplit | null> {
    const data = await prisma.vacationSplit.findUnique({
      where: { id: id.toString() },
    });

    if (!data) return null;
    return mapPrismaToDomain(data);
  }

  async findByVacationPeriodId(
    vacationPeriodId: string,
  ): Promise<VacationSplit[]> {
    const results = await prisma.vacationSplit.findMany({
      where: { vacationPeriodId },
      orderBy: { splitNumber: 'asc' },
    });

    return results.map(mapPrismaToDomain);
  }

  async findActiveByVacationPeriodId(
    vacationPeriodId: string,
  ): Promise<VacationSplit[]> {
    const results = await prisma.vacationSplit.findMany({
      where: {
        vacationPeriodId,
        status: { not: 'CANCELLED' },
      },
      orderBy: { splitNumber: 'asc' },
    });

    return results.map(mapPrismaToDomain);
  }

  async countActiveByVacationPeriodId(
    vacationPeriodId: string,
  ): Promise<number> {
    return prisma.vacationSplit.count({
      where: {
        vacationPeriodId,
        status: { not: 'CANCELLED' },
      },
    });
  }

  async save(split: VacationSplit): Promise<void> {
    await prisma.vacationSplit.update({
      where: { id: split.id.toString() },
      data: {
        status: split.status,
        paymentDate: split.paymentDate,
        paymentAmount: split.paymentAmount,
      },
    });
  }

  async delete(id: UniqueEntityID): Promise<void> {
    await prisma.vacationSplit.delete({
      where: { id: id.toString() },
    });
  }
}
