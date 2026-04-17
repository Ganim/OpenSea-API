import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import { TimeBank } from '@/entities/hr/time-bank';
import type {
  CreateTimeBankSchema,
  TimeBankRepository,
  UpdateTimeBankSchema,
} from '../time-bank-repository';

export class InMemoryTimeBankRepository implements TimeBankRepository {
  private items: TimeBank[] = [];

  async create(data: CreateTimeBankSchema): Promise<TimeBank> {
    const id = new UniqueEntityID();
    const timeBank = TimeBank.create(
      {
        tenantId: new UniqueEntityID(data.tenantId),
        employeeId: data.employeeId,
        balance: data.balance,
        year: data.year,
      },
      id,
    );

    this.items.push(timeBank);
    return timeBank;
  }

  async findById(
    id: UniqueEntityID,
    tenantId: string,
  ): Promise<TimeBank | null> {
    const timeBank = this.items.find(
      (item) => item.id.equals(id) && item.tenantId.toString() === tenantId,
    );
    return timeBank || null;
  }

  async findByEmployeeAndYear(
    employeeId: UniqueEntityID,
    year: number,
    tenantId: string,
  ): Promise<TimeBank | null> {
    const timeBank = this.items.find(
      (item) =>
        item.employeeId.equals(employeeId) &&
        item.year === year &&
        item.tenantId.toString() === tenantId,
    );
    return timeBank || null;
  }

  async findManyByEmployee(
    employeeId: UniqueEntityID,
    tenantId: string,
  ): Promise<TimeBank[]> {
    return this.items
      .filter(
        (item) =>
          item.employeeId.equals(employeeId) &&
          item.tenantId.toString() === tenantId,
      )
      .sort((a, b) => b.year - a.year);
  }

  async findManyByYear(year: number, tenantId: string): Promise<TimeBank[]> {
    return this.items.filter(
      (item) => item.year === year && item.tenantId.toString() === tenantId,
    );
  }

  async update(data: UpdateTimeBankSchema): Promise<TimeBank | null> {
    const index = this.items.findIndex(
      (item) =>
        item.id.equals(data.id) &&
        (!data.tenantId || item.tenantId.toString() === data.tenantId),
    );

    if (index === -1) return null;

    const existing = this.items[index];

    const updated = TimeBank.create(
      {
        tenantId: existing.tenantId,
        employeeId: existing.employeeId,
        balance: data.balance ?? existing.balance,
        year: existing.year,
      },
      existing.id,
    );

    this.items[index] = updated;
    return updated;
  }

  async save(timeBank: TimeBank): Promise<void> {
    const index = this.items.findIndex((item) => item.id.equals(timeBank.id));

    if (index !== -1) {
      this.items[index] = timeBank;
    }
  }

  async optimisticSave(
    timeBank: TimeBank,
    expectedVersion: number,
  ): Promise<boolean> {
    const index = this.items.findIndex((item) => item.id.equals(timeBank.id));

    if (index === -1) return false;

    const currentRecord = this.items[index];
    if (currentRecord.version !== expectedVersion) {
      return false;
    }

    const updatedTimeBank = TimeBank.create(
      {
        tenantId: timeBank.tenantId,
        employeeId: timeBank.employeeId,
        balance: timeBank.balance,
        year: timeBank.year,
        version: expectedVersion + 1,
      },
      timeBank.id,
    );

    this.items[index] = updatedTimeBank;
    return true;
  }

  async delete(id: UniqueEntityID, tenantId?: string): Promise<void> {
    const index = this.items.findIndex(
      (item) =>
        item.id.equals(id) &&
        (!tenantId || item.tenantId.toString() === tenantId),
    );
    if (index !== -1) {
      this.items.splice(index, 1);
    }
  }
}
