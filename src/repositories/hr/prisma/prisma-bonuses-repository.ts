import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import { Bonus } from '@/entities/hr/bonus';
import { prisma } from '@/lib/prisma';
import { mapBonusPrismaToDomain } from '@/mappers/hr/bonus';
import type {
  BonusesRepository,
  CreateBonusSchema,
  FindBonusFilters,
  UpdateBonusSchema,
} from '../bonuses-repository';

export class PrismaBonusesRepository implements BonusesRepository {
  async create(data: CreateBonusSchema): Promise<Bonus> {
    const bonusData = await prisma.bonus.create({
      data: {
        tenantId: data.tenantId,
        employeeId: data.employeeId.toString(),
        name: data.name,
        amount: data.amount,
        reason: data.reason,
        date: data.date,
        isPaid: false,
      },
    });

    return Bonus.create(
      mapBonusPrismaToDomain(bonusData),
      new UniqueEntityID(bonusData.id),
    );
  }

  async findById(id: UniqueEntityID, tenantId: string): Promise<Bonus | null> {
    const bonusData = await prisma.bonus.findFirst({
      where: { id: id.toString(), tenantId },
    });

    if (!bonusData) return null;

    return Bonus.create(
      mapBonusPrismaToDomain(bonusData),
      new UniqueEntityID(bonusData.id),
    );
  }

  async findMany(
    tenantId: string,
    filters?: FindBonusFilters,
  ): Promise<Bonus[]> {
    const bonuses = await prisma.bonus.findMany({
      where: {
        tenantId,
        employeeId: filters?.employeeId?.toString(),
        isPaid: filters?.isPaid,
        date: {
          gte: filters?.startDate,
          lte: filters?.endDate,
        },
      },
      orderBy: { date: 'desc' },
    });

    return bonuses.map((item) =>
      Bonus.create(mapBonusPrismaToDomain(item), new UniqueEntityID(item.id)),
    );
  }

  async findManyByEmployee(
    employeeId: UniqueEntityID,
    tenantId: string,
  ): Promise<Bonus[]> {
    const bonuses = await prisma.bonus.findMany({
      where: {
        tenantId,
        employeeId: employeeId.toString(),
      },
      orderBy: { date: 'desc' },
    });

    return bonuses.map((item) =>
      Bonus.create(mapBonusPrismaToDomain(item), new UniqueEntityID(item.id)),
    );
  }

  async findManyPending(tenantId: string): Promise<Bonus[]> {
    const bonuses = await prisma.bonus.findMany({
      where: {
        tenantId,
        isPaid: false,
      },
      orderBy: { date: 'asc' },
    });

    return bonuses.map((item) =>
      Bonus.create(mapBonusPrismaToDomain(item), new UniqueEntityID(item.id)),
    );
  }

  async findManyPendingByEmployee(
    employeeId: UniqueEntityID,
    tenantId: string,
  ): Promise<Bonus[]> {
    const bonuses = await prisma.bonus.findMany({
      where: {
        tenantId,
        employeeId: employeeId.toString(),
        isPaid: false,
      },
      orderBy: { date: 'asc' },
    });

    return bonuses.map((item) =>
      Bonus.create(mapBonusPrismaToDomain(item), new UniqueEntityID(item.id)),
    );
  }

  async findPendingByEmployee(
    employeeId: UniqueEntityID,
    tenantId: string,
  ): Promise<Bonus[]> {
    return this.findManyPendingByEmployee(employeeId, tenantId);
  }

  async findManyByPeriod(
    startDate: Date,
    endDate: Date,
    tenantId: string,
  ): Promise<Bonus[]> {
    const bonuses = await prisma.bonus.findMany({
      where: {
        tenantId,
        date: {
          gte: startDate,
          lte: endDate,
        },
      },
      orderBy: { date: 'asc' },
    });

    return bonuses.map((item) =>
      Bonus.create(mapBonusPrismaToDomain(item), new UniqueEntityID(item.id)),
    );
  }

  async sumPendingByEmployee(
    employeeId: UniqueEntityID,
    tenantId: string,
  ): Promise<number> {
    const result = await prisma.bonus.aggregate({
      _sum: { amount: true },
      where: {
        tenantId,
        employeeId: employeeId.toString(),
        isPaid: false,
      },
    });

    return Number(result._sum?.amount ?? 0);
  }

  async update(data: UpdateBonusSchema): Promise<Bonus | null> {
    const existingBonus = await prisma.bonus.findUnique({
      where: { id: data.id.toString() },
    });

    if (!existingBonus) return null;

    const bonusData = await prisma.bonus.update({
      where: { id: data.id.toString() },
      data: {
        name: data.name,
        amount: data.amount,
        reason: data.reason,
        date: data.date,
        isPaid: data.isPaid,
      },
    });

    return Bonus.create(
      mapBonusPrismaToDomain(bonusData),
      new UniqueEntityID(bonusData.id),
    );
  }

  async delete(id: UniqueEntityID): Promise<void> {
    await prisma.bonus.delete({
      where: { id: id.toString() },
    });
  }

  async save(bonus: Bonus): Promise<void> {
    await prisma.bonus.update({
      where: { id: bonus.id.toString() },
      data: {
        name: bonus.name,
        amount: bonus.amount,
        reason: bonus.reason,
        date: bonus.date,
        isPaid: bonus.isPaid,
      },
    });
  }
}
