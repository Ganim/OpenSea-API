import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import { TimeBank } from '@/entities/hr/time-bank';
import { prisma } from '@/lib/prisma';
import { mapTimeBankPrismaToDomain } from '@/mappers/hr/time-bank';
import type {
  CreateTimeBankSchema,
  TimeBankRepository,
  UpdateTimeBankSchema,
} from '../time-bank-repository';

export class PrismaTimeBankRepository implements TimeBankRepository {
  async create(data: CreateTimeBankSchema): Promise<TimeBank> {
    const timeBankData = await prisma.timeBank.create({
      data: {
        tenantId: data.tenantId,
        employeeId: data.employeeId.toString(),
        balance: data.balance,
        year: data.year,
      },
    });

    const timeBank = TimeBank.create(
      mapTimeBankPrismaToDomain(timeBankData),
      new UniqueEntityID(timeBankData.id),
    );
    return timeBank;
  }

  async findById(
    id: UniqueEntityID,
    tenantId: string,
  ): Promise<TimeBank | null> {
    const timeBankData = await prisma.timeBank.findUnique({
      where: { id: id.toString(), tenantId },
    });

    if (!timeBankData) return null;

    const timeBank = TimeBank.create(
      mapTimeBankPrismaToDomain(timeBankData),
      new UniqueEntityID(timeBankData.id),
    );
    return timeBank;
  }

  async findByEmployeeAndYear(
    employeeId: UniqueEntityID,
    year: number,
    tenantId: string,
  ): Promise<TimeBank | null> {
    const timeBankData = await prisma.timeBank.findFirst({
      where: {
        employeeId: employeeId.toString(),
        year,
        tenantId,
      },
    });

    if (!timeBankData) return null;

    const timeBank = TimeBank.create(
      mapTimeBankPrismaToDomain(timeBankData),
      new UniqueEntityID(timeBankData.id),
    );
    return timeBank;
  }

  async findManyByEmployee(
    employeeId: UniqueEntityID,
    tenantId: string,
  ): Promise<TimeBank[]> {
    const timeBanks = await prisma.timeBank.findMany({
      where: { employeeId: employeeId.toString(), tenantId },
      orderBy: { year: 'desc' },
    });

    return timeBanks.map((timeBankRecord) =>
      TimeBank.create(
        mapTimeBankPrismaToDomain(timeBankRecord),
        new UniqueEntityID(timeBankRecord.id),
      ),
    );
  }

  async findManyByYear(year: number, tenantId: string): Promise<TimeBank[]> {
    const timeBanks = await prisma.timeBank.findMany({
      where: { year, tenantId },
      orderBy: { employeeId: 'asc' },
    });

    return timeBanks.map((timeBankRecord) =>
      TimeBank.create(
        mapTimeBankPrismaToDomain(timeBankRecord),
        new UniqueEntityID(timeBankRecord.id),
      ),
    );
  }

  async update(data: UpdateTimeBankSchema): Promise<TimeBank | null> {
    const existingTimeBank = await prisma.timeBank.findUnique({
      where: { id: data.id.toString() },
    });

    if (!existingTimeBank) return null;

    const timeBankData = await prisma.timeBank.update({
      where: { id: data.id.toString() },
      data: {
        balance: data.balance,
      },
    });

    const timeBank = TimeBank.create(
      mapTimeBankPrismaToDomain(timeBankData),
      new UniqueEntityID(timeBankData.id),
    );
    return timeBank;
  }

  async save(timeBank: TimeBank): Promise<void> {
    await prisma.timeBank.update({
      where: { id: timeBank.id.toString() },
      data: {
        balance: timeBank.balance,
      },
    });
  }

  async delete(id: UniqueEntityID): Promise<void> {
    await prisma.timeBank.delete({
      where: { id: id.toString() },
    });
  }
}
