import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import { SalaryHistory } from '@/entities/hr/salary-history';
import { prisma } from '@/lib/prisma';
import { mapSalaryHistoryPrismaToDomain } from '@/mappers/hr/salary-history';
import type {
  CreateSalaryHistorySchema,
  SalaryHistoryRepository,
} from '../salary-history-repository';

export class PrismaSalaryHistoryRepository implements SalaryHistoryRepository {
  async create(data: CreateSalaryHistorySchema): Promise<SalaryHistory> {
    const record = await prisma.salaryHistory.create({
      data: {
        tenantId: data.tenantId,
        employeeId: data.employeeId.toString(),
        previousSalary: data.previousSalary ?? null,
        newSalary: data.newSalary,
        reason: data.reason,
        notes: data.notes ?? null,
        effectiveDate: data.effectiveDate,
        changedBy: data.changedBy.toString(),
      },
    });

    return SalaryHistory.create(
      mapSalaryHistoryPrismaToDomain(record),
      new UniqueEntityID(record.id),
    );
  }

  async findManyByEmployee(
    employeeId: UniqueEntityID,
    tenantId: string,
  ): Promise<SalaryHistory[]> {
    const records = await prisma.salaryHistory.findMany({
      where: {
        employeeId: employeeId.toString(),
        tenantId,
      },
      orderBy: { effectiveDate: 'desc' },
    });

    return records.map((record) =>
      SalaryHistory.create(
        mapSalaryHistoryPrismaToDomain(record),
        new UniqueEntityID(record.id),
      ),
    );
  }

  async findLatestByEmployee(
    employeeId: UniqueEntityID,
    tenantId: string,
  ): Promise<SalaryHistory | null> {
    const record = await prisma.salaryHistory.findFirst({
      where: {
        employeeId: employeeId.toString(),
        tenantId,
      },
      orderBy: { effectiveDate: 'desc' },
    });

    if (!record) return null;

    return SalaryHistory.create(
      mapSalaryHistoryPrismaToDomain(record),
      new UniqueEntityID(record.id),
    );
  }
}
