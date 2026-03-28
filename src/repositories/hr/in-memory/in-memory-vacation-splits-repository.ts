import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import { VacationSplit } from '@/entities/hr/vacation-split';
import type {
  CreateVacationSplitSchema,
  VacationSplitsRepository,
} from '../vacation-splits-repository';

export class InMemoryVacationSplitsRepository
  implements VacationSplitsRepository
{
  public items: VacationSplit[] = [];

  async create(data: CreateVacationSplitSchema): Promise<VacationSplit> {
    const vacationSplit = VacationSplit.create({
      vacationPeriodId: new UniqueEntityID(data.vacationPeriodId),
      splitNumber: data.splitNumber,
      startDate: data.startDate,
      endDate: data.endDate,
      days: data.days,
      status: data.status ?? 'SCHEDULED',
      paymentDate: data.paymentDate,
      paymentAmount: data.paymentAmount,
    });

    this.items.push(vacationSplit);
    return vacationSplit;
  }

  async findById(id: UniqueEntityID): Promise<VacationSplit | null> {
    return this.items.find((item) => item.id.equals(id)) ?? null;
  }

  async findByVacationPeriodId(
    vacationPeriodId: string,
  ): Promise<VacationSplit[]> {
    return this.items
      .filter((item) => item.vacationPeriodId.toString() === vacationPeriodId)
      .sort((a, b) => a.splitNumber - b.splitNumber);
  }

  async findActiveByVacationPeriodId(
    vacationPeriodId: string,
  ): Promise<VacationSplit[]> {
    return this.items
      .filter(
        (item) =>
          item.vacationPeriodId.toString() === vacationPeriodId &&
          !item.isCancelled(),
      )
      .sort((a, b) => a.splitNumber - b.splitNumber);
  }

  async countActiveByVacationPeriodId(
    vacationPeriodId: string,
  ): Promise<number> {
    return this.items.filter(
      (item) =>
        item.vacationPeriodId.toString() === vacationPeriodId &&
        !item.isCancelled(),
    ).length;
  }

  async save(split: VacationSplit): Promise<void> {
    const index = this.items.findIndex((item) => item.id.equals(split.id));
    if (index >= 0) {
      this.items[index] = split;
    }
  }

  async delete(id: UniqueEntityID): Promise<void> {
    const index = this.items.findIndex((item) => item.id.equals(id));
    if (index >= 0) {
      this.items.splice(index, 1);
    }
  }
}
