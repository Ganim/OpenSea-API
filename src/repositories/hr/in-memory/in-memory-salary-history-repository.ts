import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import { SalaryHistory } from '@/entities/hr/salary-history';
import type {
  CreateSalaryHistorySchema,
  SalaryHistoryRepository,
} from '../salary-history-repository';

export class InMemorySalaryHistoryRepository
  implements SalaryHistoryRepository
{
  public items: SalaryHistory[] = [];

  async create(data: CreateSalaryHistorySchema): Promise<SalaryHistory> {
    const record = SalaryHistory.create({
      tenantId: new UniqueEntityID(data.tenantId),
      employeeId: data.employeeId,
      previousSalary: data.previousSalary,
      newSalary: data.newSalary,
      reason: data.reason,
      notes: data.notes,
      effectiveDate: data.effectiveDate,
      changedBy: data.changedBy,
    });

    this.items.push(record);
    return record;
  }

  async findManyByEmployee(
    employeeId: UniqueEntityID,
    tenantId: string,
  ): Promise<SalaryHistory[]> {
    return this.items
      .filter(
        (record) =>
          record.employeeId.equals(employeeId) &&
          record.tenantId.toString() === tenantId,
      )
      .sort((a, b) => b.effectiveDate.getTime() - a.effectiveDate.getTime());
  }

  async findLatestByEmployee(
    employeeId: UniqueEntityID,
    tenantId: string,
  ): Promise<SalaryHistory | null> {
    const matches = await this.findManyByEmployee(employeeId, tenantId);
    return matches.length > 0 ? matches[0] : null;
  }
}
