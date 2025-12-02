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

  async findById(id: UniqueEntityID): Promise<TimeBank | null> {
    const timeBankData = await prisma.timeBank.findUnique({
      where: { id: id.toString() },
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
  ): Promise<TimeBank | null> {
    const timeBankData = await prisma.timeBank.findUnique({
      where: {
        employeeId_year: {
          employeeId: employeeId.toString(),
          year,
        },
      },
    });

    if (!timeBankData) return null;

    const timeBank = TimeBank.create(
      mapTimeBankPrismaToDomain(timeBankData),
      new UniqueEntityID(timeBankData.id),
    );
    return timeBank;
  }

  async findManyByEmployee(employeeId: UniqueEntityID): Promise<TimeBank[]> {
    const timeBanks = await prisma.timeBank.findMany({
      where: { employeeId: employeeId.toString() },
      orderBy: { year: 'desc' },
    });

    return timeBanks.map((item) =>
      TimeBank.create(
        mapTimeBankPrismaToDomain(item),
        new UniqueEntityID(item.id),
      ),
    );
  }

  async findManyByYear(year: number): Promise<TimeBank[]> {
    const timeBanks = await prisma.timeBank.findMany({
      where: { year },
      orderBy: { employeeId: 'asc' },
    });

    return timeBanks.map((item) =>
      TimeBank.create(
        mapTimeBankPrismaToDomain(item),
        new UniqueEntityID(item.id),
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
