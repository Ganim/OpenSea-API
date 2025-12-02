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
        employeeId: data.employeeId,
        balance: data.balance,
        year: data.year,
      },
      id,
    );

    this.items.push(timeBank);
    return timeBank;
  }

  async findById(id: UniqueEntityID): Promise<TimeBank | null> {
    const timeBank = this.items.find((item) => item.id.equals(id));
    return timeBank || null;
  }

  async findByEmployeeAndYear(
    employeeId: UniqueEntityID,
    year: number,
  ): Promise<TimeBank | null> {
    const timeBank = this.items.find(
      (item) => item.employeeId.equals(employeeId) && item.year === year,
    );
    return timeBank || null;
  }

  async findManyByEmployee(employeeId: UniqueEntityID): Promise<TimeBank[]> {
    return this.items
      .filter((item) => item.employeeId.equals(employeeId))
      .sort((a, b) => b.year - a.year);
  }

  async findManyByYear(year: number): Promise<TimeBank[]> {
    return this.items.filter((item) => item.year === year);
  }

  async update(data: UpdateTimeBankSchema): Promise<TimeBank | null> {
    const index = this.items.findIndex((item) => item.id.equals(data.id));

    if (index === -1) return null;

    const existing = this.items[index];

    const updated = TimeBank.create(
      {
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

  async delete(id: UniqueEntityID): Promise<void> {
    const index = this.items.findIndex((item) => item.id.equals(id));
    if (index !== -1) {
      this.items.splice(index, 1);
    }
  }
}
